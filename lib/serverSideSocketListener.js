

module.exports.start = function(io,  model){

    /***
     * Calls cmdStr on console and runs callback function with parameter content
     * @param cmdStr
     * @param content
     * @param callback
     */
    var executeCommandLineProcess = function (cmdStr, callback){

        try {
            var exec = require('child_process').exec;


            exec(cmdStr, function (error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                if (stderr)
                    console.log('stderr: ' + stderr);
                if (error !== null) {
                    if (callback) callback(error);
                    console.log('exec error: ' + error);
                }

                if (callback) callback();

            });
        }
        catch(error){
            if (callback) callback("Error " + error);
        }


    };
    /***
     * Read the file to visualize and return its contents in callback
     * @param filePath : path+fileName
     * @param callback
     */
    var readJsonFile =  function(filePath, callback ){

        try {
            var fs = require('fs');
            fs.readFile(filePath, 'utf-8', function (error, fileContent) {
                if (error) {
                    if (callback) callback("Error " + error)
                    console.log('exec error: ' + error);
                    return;
                }

                if (callback) {
                    callback(fileContent);
                }


            });
        }
        catch(error){
            if (callback) callback("Error " + error);
        }

    };

    //Listening to socket events
    io.sockets.on('connection', function (socket) {

        socket.on('error', function (error) {
            console.log(error);
            //  socket.destroy()
        });


        var fs =  require('fs');

        //Client requests to download output files
        socket.on('downloadRequest', function(room, callback){
            try {
                executeCommandLineProcess(("zip -r ./analysisOut/" + room + " ./analysisOut/" + room), function () {

                    fs.readFile(('./analysisOut/' + room + '.zip'), function (err, fileContent) {
                        if (callback) callback(fileContent.toString('base64'));

                    });

                });
            }
            catch(error){
                console.log(error);
                if(callback) callback("Error " + error);
            }
        });



        //Client sends analysis files in a zip file
        socket.on('analysisZip', function(fileContent, room, callback){
            try {
                var p1 = new Promise(function (resolve, reject) {
                    fs.writeFile(("./analysisOut/" + room + '.zip'), fileContent, 'binary', function (err) {
                        if (err) {
                            console.log('File could not be saved.');
                            reject();
                        } else {
                            console.log("File is saved.");
                            resolve("success");

                        }
                    });
                });
                p1.then(function (content) {
                    //Unzip file
                    var cmd1 = ("unzip -j ./analysisOut/" + room + '.zip ' + " -d ./analysisOut/" + room );

                    // var cmd2 = "sleep 5"; //wait 5 seconds for unzipping
                    var cmd2 = "java -jar './jar/causalpath.jar' ./analysisOut/" + room;

                    executeCommandLineProcess((cmd1 + "\n " + cmd2 ), function () {
                        //Return the json file from the analysis directory to the client
                        readJsonFile(('./analysisOut/' + room + '/causative.json'), callback);
                    });


                }), function (xhr, status, error) {
                    api.set('content.text', "Error retrieving data: " + error);
                    if(callback) callback("Error " + error);
                }
            }
            catch(error){
                console.log(error);
                if(callback) callback("Error " + error);
            }

        });

        //Client sends analysis files in an array
        socket.on('analysisDir', function (inputFiles, room, callback) { //from computer agent

            try{
                //get file and send it to the client for visualization
                var fs = require('fs');
                var dir = ('./analysisOut/' + room);
                if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                }


                var written = 0;
                //Make sure all the files are transferred from the socket
                var p1 = new Promise(function (resolve, reject) {

                    for (var i = 0; i < inputFiles.length; i++) {

                        (function (file) {

                            fs.writeFile(("./analysisOut/" + room + "/" + file.name), file.content, function (err) {
                                if (err) console.log(err);
                                written++;
                                if (written >= inputFiles.length)
                                    resolve("success");
                            });
                        })(inputFiles[i]);
                    }
                });

                p1.then(function (content) { 

                    //Run java analysis command after all the input files are transferred
                    executeCommandLineProcess(("java -jar './jar/causalpath.jar' ./analysisOut/" + room), function(){

                    //Return the json file from the analysis directory to the client
                    readJsonFile(('./analysisOut/' + room + '/causative.json'), callback);
                });


                }), function (xhr, status, error) {
                    api.set('content.text', "Error retrieving data: " + error);
                    if(callback) callback("Error " + error);

                }
            }
            catch(error) {
                console.log(error);
                if(callback) callback("Error " + error);
            }

        });


    });




}


