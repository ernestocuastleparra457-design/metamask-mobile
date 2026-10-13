import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Engine from '../../../../core/Engine';
import {
  setEarningsSummary,
  setEarningsSummaryError,
  setEarningsSummaryLoading,
} from '../../../../reducers/rewardsMoney';
import type { EarningsSummaryDto } from '../../../../core/Engine/controllers/rewards-money-controller/types';
import { reportRewardsMoneyReadFailure } from './reportRewardsMoneyReadFailure';
import { useOneShotBusyRefetch } from './useOneShotBusyRefetch';

/**
 * Fetches the unnarrowed `GET /earnings/summary` into the profile-keyed
 * `rewardsMoney` slice, for the hero totals on the Money dashboard.
 *
 * The profile id is passed in rather than resolved here: the dashboard already
 * resolved the session to read referral me, and a second resolution could
 * disagree with the one the screen is rendering. Writing under that id is also
 * what makes a late response harmless — it lands under the profile that asked
 * for it, and a screen on a different profile reads a different key.
 *
 * One call covers both heroes. Narrowing by origin type would split the
 * response across cache buckets for no gain: the summary carries every family
 * either card needs, and the controller caches it per profile.
 */
export const useEarningsSummary = (
  profileId: string | undefined,
): {
  fetchEarningsSummary: (options?: {
    forceFresh?: boolean;
  }) => Promise<EarningsSummaryDto | undefined>;
} => {
  const dispatch = useDispatch();
  const { cancel: cancelBusyRefetch, arm: armBusyRefetch } =
    useOneShotBusyRefetch();
  const fetchRef = useRef<
    (options?: {
      forceFresh?: boolean;
      followUp?: boolean;
    }) => Promise<EarningsSummaryDto | undefined>
  >(() => Promise.resolve(undefined));
  const isLoadingRef = useRef(false);

  const fetchEarningsSummary = useCallback(
    async ({
      forceFresh,
      followUp = false,
    }: { forceFresh?: boolean; followUp?: boolean } = {}): Promise<
      EarningsSummaryDto | undefined
    > => {
      if (!profileId) {
        return undefined;
      }
      // The Earnings tab stays mounted. A second call on this instance
      // does not start another request, and it has no summary to return.
      if (isLoadingRef.current) {
        return undefined;
      }
      isLoadingRef.current = true;

      cancelBusyRefetch();
      dispatch(setEarningsSummaryLoading({ profileId, loading: true }));
      dispatch(setEarningsSummaryError({ profileId, error: false }));

      try {
        const summary: EarningsSummaryDto =
          await Engine.controllerMessenger.call(
            'RewardsMoneyController:getEarningsSummary',
            { forceFresh },
          );
        dispatch(setEarningsSummary({ profileId, data: summary }));
        return summary;
      } catch (error) {
        reportRewardsMoneyReadFailure(
          error,
          'earningsSummary.fetch_failed',
          followUp,
          'rewards-money',
        );
        dispatch(setEarningsSummaryError({ profileId, error: true }));
        if (!followUp) {
          armBusyRefetch(error, () => {
            // The slice already holds the error, and this retry has no caller.
            void fetchRef
              .current({ forceFresh: true, followUp: true })
              .catch(() => undefined);
          });
        }
        throw error;
      } finally {
        isLoadingRef.current = false;
        dispatch(setEarningsSummaryLoading({ profileId, loading: false }));
      }
    },
    [armBusyRefetch, cancelBusyRefetch, dispatch, profileId],
  );
  fetchRef.current = fetchEarningsSummary;

  useFocusEffect(
    useCallback(() => {
      // The error is already on the slice. A focus refresh has no caller to
      // tell, so the rejection stops here.
      void fetchEarningsSummary().catch(() => undefined);
    }, [fetchEarningsSummary]),
  );

  return { fetchEarningsSummary };
};
