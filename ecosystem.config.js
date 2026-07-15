module.exports = {
  apps: [
    {
      name: 'sprints',
      cwd: '.',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT_WEB: 3000,
      },
    },
    {
      name: 'sprints-worker',
      cwd: '.',
      script: 'lib/jobs/worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
