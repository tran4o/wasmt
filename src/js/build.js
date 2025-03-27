const os = require("os");
const unzipper = require("unzipper");
const fs = require("fs");
const url = require("url");
const https = require("https");

//https://github.com/postgis/postgis/tree/stable-3.5
const postGISVersion = "3.5.2";
const postGISVersionPfx = 'pg17'; // windows only ? 
//----------------------------------------------------------------------------------------------------
(async function(){
	switch (os.platform()) 
	{
		case "linux":
		case "darwin":
			console.warn(`native-tools.PG-EMBEDDED : POSTGIS binary not available for OS '${os.platform}', skipping! TODO TODO BUILD FROM SOURCE!`);	
			return;
	}
	const targetDir = './target';
	const postgisDir = `${targetDir}/postgis`;
	const vkey = postGISVersionPfx+"-"+postGISVersion;
	//----------------------------------------------------------------------------------------------------
	if (!fs.existsSync(`${postgisDir}/.done`) || fs.readFileSync(`${postgisDir}/.done`,'utf8') != vkey)  {
		if (fs.existsSync(postgisDir))
			fs.rmSync(postgisDir,{recursive:true});
		switch (os.platform()) 
		{
			case "win32":
				var tmpd = `${postgisDir}.tmp`;
				if (fs.existsSync(tmpd))
					fs.rmSync(tmpd,{recursive:true});
				await downloadAndExtract(`https://download.osgeo.org/postgis/windows/pg17/postgis-bundle-${postGISVersionPfx}-${postGISVersion}x64.zip`,tmpd);
				fs.renameSync(`${tmpd}/postgis-bundle-${postGISVersionPfx}-${postGISVersion}x64`,postgisDir);	
				//fs.rmSync(tmpd);
				break;		
			// TODO BUILD FROM SOURCE, REQUIRES NEEDS PG BUILD TOO? 
			case "linux":
			case "darwin":
			default:
				throw new Error(`PG-EMBEDDED fetching POSTGIS BINARY : OS '${os.platform}' not supported!`);	
		}
	
		/* CLEANUP NOT NEEDED COMPONENTS */
		for (var e of [
			`${postgisDir}/bin/postgisgui`,
			`${postgisDir}/docs`,
			`${postgisDir}/gdal-data`,
		]) if (fs.existsSync(e))
			fs.rmSync(e,{recursive:true});	
			
		/* WRITE DONE */
		fs.writeFileSync(`${postgisDir}/.done`,vkey,'utf8')
	}
})();

async function downloadAndExtract(fileUrl,outputDir) {
	const outputFilePath = os.tmpdir()+"/download.pg-embd.zip";
	const parsedUrl = url.parse(fileUrl);
    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'GET',
        headers: {
            'User-Agent': 'Node.js File Downloader'
        }
    };
	console.warn("Downloading ",fileUrl);
	await new Promise(function(resolve,reject) {
		https.get(options, (response) => {
		    const { statusCode } = response;
		    if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
		        // Follow redirect
		        const redirectUrl = new URL(response.headers.location, fileUrl).toString();
		        console.log(`Redirecting to: ${redirectUrl}`);
		        downloadAndExtract(redirectUrl, outputFilePath);
		    } else if (statusCode === 200) {
		        // Write data to file
		        const fileStream = fs.createWriteStream(outputFilePath);
		        response.pipe(fileStream);
		        fileStream.on('finish', () => {
		            fileStream.close();
		            resolve();         
		        });
		    } else {
		        console.error(`Download failed with status code: ${statusCode}`);
				reject(statusCode);
		    }
		}).on('error', (err) => {
		    console.error(`Error downloading file: ${err.message}`);
			reject(err);
		});
	});
	console.warn("Unzipping",outputFilePath);
	await unzipFile(outputFilePath, outputDir);
	
}
async function unzipFile(zipFilePath, outputDir) {
    console.log(`Extracting ${zipFilePath} to ${outputDir}...`);
	await new Promise(function(resolve,reject) {
		fs.createReadStream(zipFilePath)
		    .pipe(unzipper.Extract({ path: outputDir }))
		    .on('close', resolve)
		    .on('error', reject);
	});
}

