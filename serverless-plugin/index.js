'use strict';

const {spawnSync} = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const ADDITIONAL_EXCLUDE = [
    '.stack-work/**',
    'node_modules/**',
];

const TEMPLATE = path.resolve(__dirname, 'handler.template.js');

const SERVERLESS_DIRECTORY = '.serverless';

class ServerlessPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.hooks = {
            'before:package:createDeploymentArtifacts': this.beforeCreateDeploymentArtifacts.bind(this),
            'after:package:createDeploymentArtifacts': this.afterCreateDeploymentArtifacts.bind(this),
        };

        // FIXME this is copied from Package class in serverless
        this.servicePath = this.serverless.config.servicePath || '';

        this.additionalFiles = [];
    }

    runStack(...args) {
        return spawnSync(
            'stack',
            args,
            {stdio: ['ignore', process.stdout, process.stderr]}
        );
    }

    beforeCreateDeploymentArtifacts() {
        const service = this.serverless.service;

        // Exclude Haskell artifacts from uploading
        service.package.exclude = service.package.exclude || [];
        service.package.exclude = [
            ...service.package.exclude,
            ...ADDITIONAL_EXCLUDE,
        ];

        let stackArgs = [];
        if (process.platform !== 'linux') {
            // Use Stack's Docker build
            this.serverless.cli.log("Using Stack's Docker image.");
            this.runStack('docker', 'pull');
            stackArgs = ['--docker'];
        }

        let handledFunctions = {};

        service.getAllFunctions()
            .map(funcName => service.getFunction(funcName))
            .forEach((func) => {
                // Extract the executable name, assuming the second component is
                // 'main'
                const [ packageName, executableName ] = func.handler.split('.');

                //Ensure the executable is built
                this.serverless.cli.log("Building handler with Stack...");
                const res = this.runStack(
                    'build',
                    `${packageName}:exe:${executableName}`,
                    ...stackArgs
                );
                if (res.error || res.status > 0) {
                    this.serverless.cli.log("Stack build encountered an error.");
                    throw new Error(res.error);
                }

                // Copy the executable to the destination directory
                const stackInstallRoot =
                      spawnSync('stack', ['path', '--local-install-root', ...stackArgs])
                      .stdout.toString('utf8').trim();
                const haskellBinary = path.resolve(stackInstallRoot, 'bin', executableName);
                const haskellBinaryPath = path.resolve(this.servicePath, executableName);
                fs.copyFileSync(haskellBinary, haskellBinaryPath);
                this.additionalFiles.push(haskellBinaryPath);

                // Remember the executable that needs to be handled by this package's shim
                handledFunctions[packageName] = handledFunctions[packageName] || [];
                handledFunctions[packageName].push(executableName);
            });

        // Create a shim to start the executable and copy it to all the
        // destination directories
        const handlerTemplate = fs.readFileSync(TEMPLATE).toString('utf8');

        Object.keys(handledFunctions).forEach(packageName => {
            let handler = handlerTemplate + handledFunctions[packageName].map(
                executableName => `exports['${executableName}'] = wrapper('${executableName}');`
            ).join("\n") + "\n";

            const handlerFileName = path.resolve(this.servicePath, `${packageName}.js`);
            fs.writeFileSync(handlerFileName, handler);
            this.additionalFiles.push(handlerFileName);
        });
    }

    afterCreateDeploymentArtifacts() {
        this.additionalFiles.forEach(fileName => fs.removeSync(fileName));
    }
}

module.exports = ServerlessPlugin;
