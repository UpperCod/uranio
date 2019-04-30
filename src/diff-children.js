import { diffNode } from "./diff-node";
import { flatMap } from "./vnode";

export function diffChildren(node, host, children, isSvg) {
	let keyes = [];

	children = flatMap(children, keyes);

	let mapKeyes = {};
	let withKeyes = mapKeyes.$;
	let childNodes = node.childNodes;
	let childNodesLength = node.childNodes.length;
	let childrenLenght = children.length;
	let index = withKeyes
		? 0
		: childNodesLength > childrenLenght
		? childrenLenght
		: childNodesLength;
	for (; index < childNodesLength; index++) {
		let childNode = childNodes[index];
		if (withKeyes) {
			key = childNode.dataset.key;
			if (keyes.indexOf(key) > -1) {
				childNodesKeyes[key] = childNode;
				continue;
			}
		}
		index--;
		childNodesLength--;
		node.removeChild(childNode);
	}
	for (let i = 0; i < childrenLenght; i++) {
		let vchild = children[i],
			indexChildNode = childNodes[i],
			nextSiblingChildNode = childNodes[i + 1],
			key = withKeyes ? vchild.key : i,
			childNode = withKeyes ? childNodesKeyes[key] : indexChildNode;

		if (withKeyes) {
			if (childNode != indexChildNode) {
				node.insertBefore(childNode, indexChildNode);
			}
		}

		let nextChildNode = diffNode(vchild, childNode, host, isSvg);

		if (!childNode) {
			if (nextSiblingChildNode) {
				node.insertBefore(nextChildNode, nextSiblingChildNode);
			} else {
				node.appendChild(nextChildNode);
			}
		}
	}
}
