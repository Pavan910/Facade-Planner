// Project persistence in the browser's localStorage. Each user's projects stay
// on their own device, so there is no shared server state to manage.

const KEY = 'facadeplan.projects';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function listProjects() {
  return read().map(({ id, name, date, thumb, src }) => ({ id, name, date, thumb: thumb || src }));
}

export function loadProject(id) {
  return read().find((p) => p.id === id);
}

export function saveProject(project) {
  const list = [project, ...read().filter((p) => p.id !== project.id)];
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    throw new Error('Browser storage is full. Delete an older project.');
  }
}

export function deleteProject(id) {
  try { localStorage.setItem(KEY, JSON.stringify(read().filter((p) => p.id !== id))); } catch { /* ignore */ }
}
