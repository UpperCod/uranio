import BaseElement from "@atomico/base-element";
import { diffNode } from "./diff-node";
export { createElement as h } from "./vnode";

export class Element extends BaseElement {
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

export function render(vnode, node, host) {
	diffNode(vnode, node, host || node);
}
