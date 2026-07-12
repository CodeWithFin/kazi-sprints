module.exports = {
  apps: [
    {
      name: 'ppp-api',
      cwd: './api',
      script: 'src/app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT_API: 4000,
      },
    },
    {
      name: 'ppp-web',
      cwd: './web',
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
      name: 'ppp-worker',
      cwd: './api',
      script: 'src/jobs/worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
