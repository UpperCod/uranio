import { diffProperties } from "./diff-properties";
import { diffChildren } from "./diff-children";
import { toVnode } from "./vnode";

export function diffNode(vnode, node, host, isSvg) {
	node && loadNode(node);

	let oldVnode = getStateVnode(node, host);
	let { type, props } = toVnode(vnode);
	let children = props.children;

	isSvg = isSvg || type == "svg";

	if (!node || (node.localName != type && type != "host")) {
		node = createNode(type, isSvg);
		loadNode(node);
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

function loadNode(node) {
	node.states = node.states || new Map();
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
	return (node ? node.states.get(host) : 0) || { props: {} };
}

function setStateVnode(node, host, state) {
	return node.states.set(host, state);
}
