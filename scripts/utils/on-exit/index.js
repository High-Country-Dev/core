/**
 * Assigns a callback to be executed when the process is terminated.
 * @param {NodeJS.ExitListener} callback Function to be executed when the process is terminated.
 */
function onExit(callback) {
  process.on('exit', callback);
  process.on('SIGINT', callback);
  process.on('SIGUSR1', callback);
  process.on('SIGUSR2', callback);
  process.on('uncaughtException', callback);
}

export default onExit;
