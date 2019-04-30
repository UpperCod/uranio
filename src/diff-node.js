import { diffProperties } from "./diff-properties";
import { diffChildren } from "./diff-children";
import { toVnode } from "./vnode";

let VNODES = "[[vnodes]]";

export function diffNode(vnode, node, host, isSvg) {
	let oldVnode = getStateVnode(node, host);
	let { type = "#text", props } = toVnode(vnode);
	let children = props.children;

	isSvg = isSvg || type == "svg";

	if (!node || (type != "host" && getNodeName(node) !== type)) {
		node = createNode(type, isSvg);
	}

	if (type == null) {
		if (node.nodeValue != children) {
			node.nodeValue = children;
		}
	} else {
		diffProperties(node, oldVnode.props || {}, props || {}, host, isSvg);
		diffChildren(
			props && props.shadowDom ? node.shadowRoot : node,
			type == "host" ? node : host,
			children,
			isSvg
		);
	}

	setStateVnode(node, host, {
		type,
		props
	});
	return node;
}

function getNodeName({ localName }) {
	return localName == "#text" ? null : localName;
}
/**
 * prepara los valores por defau
 * @param {*} node
 */
function loadNode(node) {
	node[VNODES] = node[VNODES] || new Map();
	if (!node.localName) {
		node.localName = node.nodeName.toLowerCase();
	}
}

function createNode(type, isSvg) {
	let nextNode;
	if (type != null) {
		nextNode = isSvg
			? document.createElementNS("http://www.w3.org/2000/svg", type)
			: document.createElement(type);
	} else {
		nextNode = document.createTextNode("");
	}
	return nextNode;
}

function getStateVnode(node, host) {
	node && loadNode(node);
	return (node ? node[VNODES].get(host) : 0) || { props: {} };
}

function setStateVnode(node, host, state) {
	loadNode(node);
	return node[VNODES].set(host, state);
}
