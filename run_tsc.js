const { exec } = require('child_process');
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  console.log(stdout);
  console.error(stderr);
  if (error) {
    process.exit(1);
  }
});
