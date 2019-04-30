import BaseElement from '@atomico/base-element';

let propsRaw = {
	className: 1,
	id: 1,
	checked: 1,
	selected: 1,
	value: 1
};

let ignoreProperties = {
	children: 1
};

let eventAlias = {};

let cssAlias = {};

let EVENTS = "[[EVENTS]]";

function diffProperties(node, oldProps, props, host, isSvg) {
	for (let name in oldProps) {
		if (ignoreProperties[name]) continue;
		if (!(name in props)) {
			setProperty(node, name, oldProps[name], null, isSvg);
		}
	}
	for (let name in props) {
		if (ignoreProperties[name]) continue;
		setProperty(node, name, oldProps[name], props[name], host, isSvg);
	}
}
function setEvent(node, type, nextHandler, host) {
	// memorize the transformation
	if (!eventAlias[type]) {
		eventAlias[type] = type.slice(2).toLocaleLowerCase();
	}
	// get the name of the event to use
	type = eventAlias[type];

	let events = (node[EVENTS] = node[EVENTS] || new Map());

	let handlers = events.get(host);
	if (!handlers) {
		handlers = {
			handleEvent(event) {
				return handlers[event.type].call(host, event);
			}
		};
		events.set(host, handlers);
	}
	if (nextHandler) {
		// create the subscriber if it does not exist
		if (!handlers[type]) {
			node.addEventListener(type, handlers);
		}
		// update the associated event
		handlers[type] = nextHandler;
	} else {
		// 	delete the associated event
		if (handlers[type]) {
			node.removeEventListener(type, handlers);
			delete handlers[type];
		}
	}
}
function setProperty(node, name, oldValue, value, host, isSvg) {
	oldValue = propsRaw[name] ? node[name] : oldValue;

	if (value == oldValue) return;

	name = name == "class" ? "className" : name;
	if (
		name[0] == "o" &&
		name[1] == "n" &&
		(typeof oldValue == "function" || typeof value == "function")
	) {
		setEvent(node, name, value, host);
		return;
	}
	switch (name) {
		case "key":
			value = "" + value;
			if (node.dataset.key != value) {
				node.dataset.key = value;
			}
			break;
		case "style":
			setStyle(node, oldValue || node.style.cssText, value);
			break;
		case "ref":
			if (value) value.current = node;
			break;
		case "shadowDom":
			if ("attachShadow" in node) {
				if ((node.shadowRoot && !value) || (!node.shadowRoot && value)) {
					node.attachShadow({ mode: value ? "open" : "closed" });
				}
			}
			break;
		default:
			if (name in node && !isSvg) {
				node[name] = value == null ? "" : value;
			} else if (value == null) {
				node.removeAttribute(name);
			} else {
				node.setAttribute(name, value);
			}
	}
}

function setStyle(node, prevValue, nextValue) {
	let prevCss = prevValue,
		nextCss = nextValue;
	if (typeof nextCss == "object") {
		nextCss = "";
		for (let key in nextValue) {
			if (!nextValue[key]) continue;
			// memorizes the transformations associated with CSS properties
			if (!cssAlias[key]) {
				cssAlias[key] = key.replace(/([A-Z])/g, "-$1").toLowerCase();
			}
			nextCss += `${cssAlias[key]}:${nextValue[key]};`;
		}
	}
	if (prevCss != nextCss) {
		node.style.cssText = nextCss;
	}
}

function createElement(type, props, children) {
	props = props || {};
	if (arguments.length > 3) {
		children = [children];
		for (let i = 3; i < arguments.length; i++) {
			children.push(arguments[i]);
		}
	}
	if (children != null) {
		props.children = children;
	}

	let vnode = { type, props },
		key = props.key;
	if (key != null) {
		vnode.key = "" + key;
	}
	return vnode;
}

function toVnode(value) {
	if (value == null || typeof value == "boolean") value = "";

	if (typeof value == "string" || typeof value == "number") {
		return createElement(null, null, "" + value);
	}

	return value;
}

function flatMap(children, keyes = [], list = []) {
	keyes = keyes || [];
	list = list || [];
	if (Array.isArray(children)) {
		let length = children.length;
		for (let i = 0; i < length; i++) {
			flatMap(children[i], keyes, list);
		}
	} else {
		let vnode = toVnode(children);
		if (typeof vnode == "object") {
			if (typeof vnode.type == "function") {
				return flatMap(vnode.type(vnode.props), keyes, list);
			}
			if (vnode.key != null) {
				if (keyes.indexOf(vnode.key) == -1) {
					keyes.push(vnode.key);
					keyes.$ = true;
				}
			}
		}
		list.push(vnode);
	}
	return list;
}

function diffChildren(node, host, children, isSvg) {
	let keyes = [];

	children = flatMap(children, keyes);
	let childNodes = node.childNodes;
	let childNodesLength = node.childNodes.length;
	let childrenLenght = children.length;
	let index = childNodesLength > childrenLenght
		? childrenLenght
		: childNodesLength;
	for (; index < childNodesLength; index++) {
		let childNode = childNodes[index];
		index--;
		childNodesLength--;
		node.removeChild(childNode);
	}
	for (let i = 0; i < childrenLenght; i++) {
		let vchild = children[i],
			indexChildNode = childNodes[i],
			nextSiblingChildNode = childNodes[i + 1],
			childNode = indexChildNode;

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

let VNODES = "[[vnodes]]";

function diffNode(vnode, node, host, isSvg) {
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

class Element extends BaseElement {
	constructor() {
		super();
		let prevent;
		let mounted;
		/**
		 * @param {Object<string,any>} - Properties to update the component
		 */
		this.update = props => {
			this.nextProps = { ...props };
			if (!prevent) {
				prevent = true;
				this.mounted.then(() => {
					prevent = false;
					let nextProps = this.nextProps;
					delete this.nextProps;

					let nextRender = !mounted;

					let props = (this.props = { ...this.props });

					for (let prop in nextProps) {
						if (nextProps[prop] !== props[prop]) {
							props[prop] = nextProps[prop];
							nextRender = true;
						}
					}

					if (!nextRender) return;

					nextRender =
						!mounted || this.beforeRender(props, nextProps || {}) != false;

					if (nextRender) {
						render(this.render(props), this);
						this.afterRender(props);
						mounted = true;
					}
				});
			}
		};

		this.unmounted.then(() => render(host, this, options));

		this.update();
	}
	beforeRender() {}
	afterRender() {}
}

function render(vnode, node, host) {
	diffNode(vnode, node, host || node);
}

export { Element, createElement as h, render };
