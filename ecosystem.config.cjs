module.exports = {
  apps: [
    {
      name: "web",
      cwd: "./apps/web",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "api",
      cwd: "./apps/api",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 8080
      }
    },
    {
      name: "builder",
      cwd: "./apps/builder",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "proxy",
      cwd: "./apps/proxy",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 8000
      }
    },
    {
      name: "worker",
      cwd: "./apps/worker",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "nortification",
      cwd: "./apps/nortification",
      script: "bun",
      args: "run start",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
