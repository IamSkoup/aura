import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dataDir=path.join(root,'.data');
const configDir=path.join(dataDir,'firebase-config');
const emulatorDir=path.join(dataDir,'emulators');
mkdirSync(configDir,{recursive:true});
mkdirSync(emulatorDir,{recursive:true});

const cli=path.join(root,'node_modules','firebase-tools','lib','bin','firebase.js');
const child=spawn(process.execPath,[cli,'emulators:start','--only','auth,database,storage','--project','aura-wear-local',...process.argv.slice(2)],{
  cwd:root,
  stdio:'inherit',
  env:{...process.env,XDG_CONFIG_HOME:configDir,FIREBASE_EMULATORS_PATH:emulatorDir,FIREBASE_TOOLS_DISABLE_UPDATE_CHECK:'true'},
});
process.on('SIGINT',()=>child.kill('SIGINT'));
process.on('SIGTERM',()=>child.kill('SIGTERM'));
child.on('exit',(code,signal)=>process.exit(code??(signal?1:0)));
