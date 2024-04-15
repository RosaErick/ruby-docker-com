import { Controller } from "@hotwired/stimulus";

// Connects to data-controller="cart"
export default class extends Controller {
  static targets = ["items", "total", "errorContainer"];

  initialize() {
    this.renderCart();
  }

  renderCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    this.itemsTarget.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
      total += item.price * item.quantity;
      const itemRow = this.createCartItemRow(item, index);
      this.itemsTarget.appendChild(itemRow);
    });

    this.totalTarget.textContent = `Subtotal: $${(total / 100).toFixed(2)}`;
  }

  createCartItemRow(item, index) {
    const div = document.createElement("div");
    div.className = "flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700";
    const imageSrc = item.image || 'path/to/your/default-image.jpg'; // Replace with path to your default image

    div.innerHTML = `
      <div class="flex items-center">
        <img src="${imageSrc}" class="w-20 h-20 object-cover rounded" alt="${item.name}" />
        <div class="ml-4">
          <div class="font-medium">${item.name}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">$${(item.price / 100).toFixed(2)}</div>
        </div>
      </div>
      <div class="flex items-center">
        <button class="px-2 py-1 border rounded text-sm mr-2" data-action="click->cart#decreaseQuantity" data-index="${index}">-</button>
        <span>${item.quantity}</span>
        <button class="px-2 py-1 border rounded text-sm ml-2" data-action="click->cart#increaseQuantity" data-index="${index}">+</button>
        <button class="ml-4 text-red-500" data-action="click->cart#removeFromCart" data-index="${index}">&times;</button>
      </div>
    `;

    return div;
  }

  increaseQuantity(event) {
    const index = event.currentTarget.dataset.index;
    const cart = JSON.parse(localStorage.getItem("cart"));
    cart[index].quantity += 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    this.renderCart();
  }

  decreaseQuantity(event) {
    const index = event.currentTarget.dataset.index;
    const cart = JSON.parse(localStorage.getItem("cart"));
    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      this.renderCart();
    }
  }

  removeFromCart(event) {
    const index = event.currentTarget.dataset.index;
    const cart = JSON.parse(localStorage.getItem("cart"));
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    this.renderCart();
  }

  clear() {
    localStorage.removeItem("cart");
    this.renderCart();
  }

  checkout() {
    const cart = JSON.parse(localStorage.getItem("cart"));
    const payload = {
      authenticity_token: this.getMetaValue("csrf-token"),
      cart: cart
    };

    fetch("/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": this.getMetaValue("csrf-token")
      },
      body: JSON.stringify(payload)
    }).then(response => {
        if (response.ok) {
          response.json().then(body => {
            window.location.href = body.url;
          });
        } else {
          response.json().then(body => {
            const errorEl = document.createElement("div");
            errorEl.innerText = `There was an error processing your order. ${body.error}`;
            this.errorContainerTarget.appendChild(errorEl);
          });
        }
      });
  }

  getMetaValue(name) {
    const element = document.head.querySelector(`meta[name="${name}"]`);
    return element.getAttribute("content");
  }
}
