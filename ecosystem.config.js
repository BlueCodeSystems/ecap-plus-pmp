module.exports = {
  apps: [
    {
      name: 'ecap-plus-pmp',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3030,
      },
    },
  ],
};

