export function runInBackground(task, label = "background task") {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error(`Failed to run ${label}:`, error)
    })
}
