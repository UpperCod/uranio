# @atomico/uranio

Pequeño experimento que quita la capa de Hooks, HoCs, Componentes Funcionales y contexto de @atomico/core.
para solo funcionar dentro de web-component.

```jsx
import { h, Element } from "@atomico/uranio";

class Counter extends Element {
	static observables = {
		value: Number
	};
	increment() {
		this.value += 1;
	}
	decrement() {
		this.value -= 1;
	}
	render() {
		return (
			<host shadowDom>
				<style>{`:host{display:block;padding:1rem}`}</style>
				<button onClick={this.increment}>increment</button>
				<span>::{this.value}::</span>
				<button onClick={this.decrement}>decrement</button>
			</host>
		);
	}
}

customElements.define("uranio-counter", Counter);
```
