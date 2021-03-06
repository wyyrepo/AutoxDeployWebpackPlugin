var http = require("http");
var path= require("path");
class WatchDeployPlugin {
  sendCmd(cmd, path) {
    path = encodeURI(path)
    var req= http.get("http://127.0.0.1:9317/exec?cmd=" + cmd + "&path=" + path, (res) => {
      res.setEncoding('utf8');
      res.on('data', (data) => {
        console.error(cmd,data);
      }).on("error",()=>{
      console.error("返回数据错误" );
      });
    });
    req.on('error', function(err){
      console.error("watch模式，自动"+cmd+"失败,autox.js服务未启动" );
      console.error("请使用 ctrl+shift+p 快捷键，启动auto.js服务");
    });
  }  
  constructor(options = {}) {
    this.options = options;
    this.changFile = "";
  }
  apply(compiler) {
    if (this.options.type != null && this.options.type != "none") {
      compiler.hooks.watchRun.tap("WatchDeployPlugin", (compiler) => {
        const changedTimes = compiler.watchFileSystem.watcher.mtimes;
        const changedFiles = Object.keys(changedTimes);
        console.error("重新编译，改变的文件：",changedFiles);
        this.changFile = changedFiles[0];
      });
      compiler.hooks.done.tap("WatchDeployPlugin", (stats) => {
        var compilation = stats.compilation;
        if (this.changFile != "") {
          compilation.chunks.forEach(chunk => {
            var modules = chunk.getModules();
            modules.forEach(module => {
            //   console.error("r---c", module.userRequest,this.changFile);
              if (module.userRequest == this.changFile) {
               //  console.error("chunk", chunk.files);
                chunk.files.forEach(file => {
                  var outFilePath = compiler.outputPath+file;
                  var projectName= path.posix.normalize(file).split(path.posix.sep)[1];
                  //console.error("projectName", projectName);
                 var outProjecPath= path.resolve(compiler.outputPath,projectName);
                 // console.error("outFilePath", outFilePath);
                 // console.error("outFilePath", outProjecPath);
                  switch (this.options.type) {
                    case "deploy":
                      this.sendCmd("save", "/"+outProjecPath);
                      break;
                    case "rerun":
                      this.sendCmd("rerun","/"+outFilePath);
                      break;
                    default:
                      break;
                  }
                })
              }
            })
          })
        }
      })
    }
  }
}
module.exports = WatchDeployPlugin;
