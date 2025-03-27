const {execSync} = require("child_process");

execSync(`vr mvn package`,{
	cwd  : __dirname,
	stdio : 'inherit'
});		
execSync(`vr mvn package -Pnative -Dagent=true exec:exec@java-agent`,{
	cwd  : __dirname,
	stdio : 'inherit'
});
execSync(`vr mvn package -Pnative -Dagent=true package`,{stdio: 'inherit',cwd  : __dirname});