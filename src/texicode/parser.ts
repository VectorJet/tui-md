/** Port of TeXicode parser.py */

import {
  parentDependentTypeDict,
  typeDependentTypeDict,
  typeDict,
  selfDependentTypeDict,
  typeInfoDict
} from "./node_data";
import type { Token, NodeType } from "./node_data";

export type NodeTuple = [NodeType, Token, number[], number[]];

function getNodeType(token: Token, parentType: string): string {
  const tokenType = token[0];
  const tokenVal = token[1];
  const tokenStr = tokenType + "," + tokenVal;

  const pdtKey = parentType + "|" + tokenStr;
  if (pdtKey in parentDependentTypeDict) {
    return parentDependentTypeDict[pdtKey];
  }

  const tdtKey = parentType + "|" + tokenType;
  if (tdtKey in typeDependentTypeDict) {
    return typeDependentTypeDict[tdtKey];
  }

  if (tokenStr in typeDict) {
    return typeDict[tokenStr];
  }

  if (tokenType in selfDependentTypeDict) {
    return selfDependentTypeDict[tokenType];
  }

  throw new Error(`Unknown token [${tokenType}, ${tokenVal}]`);
}

function getScriptBase(nodeType: string, nodes: NodeTuple[], parentStack: number[]): number {
  const scriptTypes = new Set(["sup_scrpt", "sub_scrpt", "top_scrpt", "btm_scrpt"]);
  if (!(parentStack.length > 0 && scriptTypes.has(nodeType))) {
    return -1;
  }
  let baseId = -1;
  const siblingList = nodes[parentStack[parentStack.length - 1]][2];
  if (siblingList.length >= 1) {
    baseId = siblingList[siblingList.length - 1];
  } else {
    return baseId;
  }
  if (scriptTypes.has(nodes[baseId][0])) {
    if (siblingList.length >= 2) {
      baseId = siblingList[siblingList.length - 2];
    } else {
      baseId = -1;
    }
  }
  return baseId;
}

function updateNodeType(baseNodeType: string, scriptNodeType: string): string {
  if (baseNodeType === "ctr_base") {
    const map: Record<string, string> = {
      "sup_scrpt": "top_scrpt",
      "sub_scrpt": "btm_scrpt",
      "cmd_lmts": "cmd_lmts"
    };
    return map[scriptNodeType] || scriptNodeType;
  }
  return scriptNodeType;
}

function canPop(parentNodeType: string, nodeType: string): boolean {
  if (parentNodeType === "none") return false;
  const popInfo = typeInfoDict[parentNodeType][0];
  const isOnly = popInfo[0];
  const popableBy = popInfo[1];
  if (isOnly) {
    if (popableBy.includes(nodeType)) return true;
  } else {
    if (!popableBy.includes(nodeType)) return true;
  }
  return false;
}

function parentStackAdd(nodeType: string, nodeId: number): number[] {
  const addStack: number[] = [];
  const addLen = typeInfoDict[nodeType][1][0];
  for (let i = 0; i < addLen; i++) {
    addStack.push(nodeId);
  }
  return addStack;
}

function canAdd(parentType: string, nodeType: string): boolean {
  if (parentType === "none") {
    if (nodeType === "opn_root") return true;
    return false;
  }
  const addInfo = typeInfoDict[nodeType][2];
  const canAddFlag = addInfo[0];
  const isErrIf = addInfo[1];
  const underList = addInfo[2];

  if (isErrIf) {
    if (underList.includes(parentType)) {
      throw new Error(`Extra ${nodeType}, under ${underList}`);
    }
  } else {
    if (!underList.includes(parentType)) {
      const expected = typeInfoDict[parentType][0][1];
      throw new Error(`Expected ${expected}, got ${nodeType}`);
    }
  }
  return canAddFlag;
}

export function parse(tokens: Token[], debug: boolean = false): NodeTuple[] {
  if (debug) console.log("Parsing");
  const nodes: NodeTuple[] = [];
  let parentStack: number[] = [];
  let nodeId = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let parentType = "none";
    let parentId = -1;
    if (parentStack.length !== 0) {
      parentId = parentStack[parentStack.length - 1];
      parentType = nodes[parentId][0];
    }
    let nodeType = getNodeType(token, parentType);
    const canAddToNodes = canAdd(parentType, nodeType);
    let canPopParent = canPop(parentType, nodeType);
    
    const flagInfo = typeInfoDict[nodeType][3];
    let canAddToChildrenList = flagInfo[0];
    const canUpdateParentId = flagInfo[1];
    const canDoublePop = flagInfo[2];
    
    const baseId = getScriptBase(nodeType, nodes, parentStack);

    // temporary solution to spaces
    if (nodeType === "txt_invs") continue;

    if (baseId !== -1) {
      const baseNode = nodes[baseId];
      nodeType = updateNodeType(baseNode[0], nodeType);
      baseNode[3].push(nodeId);
      canAddToChildrenList = false;
      canPopParent = false;
    }
    if (nodeType === "cmd_end") {
      while (parentStack.length > 0 && nodes[parentStack[parentStack.length - 1]][0] !== "cmd_bgin") {
        parentStack.pop();
      }
      if (parentStack.length > 0) parentStack.pop();
    } else if (canPopParent) {
      parentStack.pop();
    }
    if (canUpdateParentId && parentStack.length > 0) {
      parentId = parentStack[parentStack.length - 1];
      parentType = nodes[parentId][0];
    }
    if (canDoublePop && parentStack.length > 0) {
      parentStack.pop();
      if (parentStack.length > 0) {
        parentId = parentStack[parentStack.length - 1];
        parentType = nodes[parentId][0];
      }
    }
    if (canAddToChildrenList && parentId !== -1) {
      nodes[parentId][2].push(nodeId);
    }
    
    parentStack = parentStack.concat(parentStackAdd(nodeType, nodeId));
    
    if (canAddToNodes) {
      const node: NodeTuple = [nodeType, token, [], []];
      nodes.push(node);
      nodeId++;
    }
    
    if (debug) {
      console.log(i, token, nodeType, parentType, parentStack);
    }
  }
  
  if (debug) {
    for (let i = 0; i < nodes.length; i++) {
      console.log(i, nodes[i]);
    }
  }
  return nodes;
}
