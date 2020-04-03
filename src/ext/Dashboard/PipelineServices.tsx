
import * as API from "azure-devops-extension-api";
import { 
  BuildRestClient, BuildDefinitionReference, Build
} from "azure-devops-extension-api/Build";

import {
  ReleaseRestClient, Deployment
} from "azure-devops-extension-api/Release";

import {
  CoreRestClient
} from "azure-devops-extension-api/core"

const coreClient = API.getClient(CoreRestClient);
const buildClient = API.getClient(BuildRestClient);
const releaseClient = API.getClient(ReleaseRestClient);

export async function getProjects() {
  let result = await coreClient.getProjects();
  return result.sort((a,b) => a.name.localeCompare(b.name) );
}

export async function getProject(projectName: string) {
  let result = await coreClient.getProject(projectName);
  return result;
}

export async function getReleasesV1(projectList: Array<string>, isFirstLoad: boolean){
  let deployments = new Array<Deployment>();
  for(let i=0;i<projectList.length;i++) {
    let result = await getReleases(projectList[i], isFirstLoad);
    deployments.push(...result);
  }
  return deployments;
}

export async function getReleases(projectName: string, isFirstLoad: boolean) {
  return new Array<Deployment>();
  
  let minDate = undefined;

  if(!isFirstLoad){
    let now = new Date();
    console.log(projectName + " : " + now.toDateString() + " - " + now.toTimeString());
    minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    console.log(projectName + " : Getting Release from: " + minDate.toDateString() + " - " + minDate.toTimeString());
  }

  let continuationToken = 0;
  let dpl = new Array<Deployment>();

  let result = new Array<Deployment>();
  do {
    result = await releaseClient.getDeployments(projectName, undefined, undefined, undefined, minDate, new Date(),
      undefined, undefined, false, undefined, 1000, continuationToken,
      undefined, undefined, undefined, undefined); 
    
    if(result.length > 1){
      continuationToken = result[result.length-1].id;
    } else {
      continuationToken = -1;
    }
    dpl.push(...result);
  } while(result.length > 0);
  console.log(projectName + " : " + dpl.length + " release founded - IsFirstLoad: " + isFirstLoad);
  return dpl;
}

export async function getBuildsV1(projectList: Array<string>, isFirstLoad: boolean) {
  let builds = new Array<Build>();
  for(let i=0;i<projectList.length;i++) {
    let result = await getBuilds(projectList[i], isFirstLoad);
    builds.push(...result);
  }
  return builds.sort((a,b) => {
    return b.id - a.id;
  });
}

export async function getBuilds(projectName: string, isFirstLoad: boolean)  {
  let result = await buildClient.getBuilds(projectName);
  return result;
}

export async function getBuildDefinitionsV1(projectList: Array<string>, isFirstLoad: boolean) {
  let buildDef = new Array<BuildDefinitionReference>();
  for(let i=0;i<projectList.length;i++) {
    let result = await getBuildDefinitions(projectList[i], isFirstLoad);
    buildDef.push(...result);
  }
  return buildDef.sort((a,b) => {
    if(b.latestBuild !== undefined && a.latestBuild !== undefined) {
      if(a.latestBuild.id > b.latestBuild.id){
        return -1;
      } else if(a.latestBuild.id < b.latestBuild.id) {
        return 1;
      } else {
        return 0;
      }
    } else if(b.latestBuild !== undefined && a.latestBuild === undefined) {
      return 1;
    } else if(b.latestBuild === undefined && a.latestBuild !== undefined) {
      return -1;
    } else {
      return 0;
    }
  });
}

export async function getBuildDefinitions(projectName: string, isFirstLoad: boolean) {
  let result = await buildClient.getDefinitions(projectName, undefined, undefined, undefined,
                                              undefined, undefined, undefined,undefined, undefined,
                                              undefined,undefined,undefined,undefined, true, undefined, 
                                              undefined, undefined);
  return result;
}
