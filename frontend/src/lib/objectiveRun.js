export async function createAndStartObjective(apiClient, title, details = '') {
  const created = await apiClient.createObjective(title, details);
  const objective = created?.objective;
  if (!objective?.id) throw new Error('The objective was not persisted with an ID.');

  const queued = await apiClient.triggerBriefing(objective.id);
  if (!queued?.run_id) throw new Error('The background queue did not return a run ID.');
  if (queued?.objective?.objective_id !== objective.id) {
    throw new Error('The queued run is not bound to the persisted objective.');
  }

  const run = {
    run_id: queued.run_id,
    objective_id: objective.id,
    objective_fingerprint: queued.objective.fingerprint,
    objective_snapshot: queued.objective,
    status: queued.job_status || 'QUEUED',
  };
  return { created, queued, objective, run };
}
