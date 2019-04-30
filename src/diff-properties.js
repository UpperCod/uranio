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

export function diffProperties(node, oldProps, props, host, isSvg) {
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
