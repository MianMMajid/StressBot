"use client";

import { useMemo, useState } from "react";

type Screen = "login" | "inventory" | "cart" | "checkout-step-one" | "checkout-step-two" | "checkout-complete";
type SortMode = "az" | "za" | "lohi" | "hilo";

type Product = {
  id: string;
  name: string;
  desc: string;
  price: number;
  emoji: string;
};

const ACCEPTED_USERS = [
  "standard_user",
  "locked_out_user",
  "problem_user",
  "performance_glitch_user",
  "error_user",
  "visual_user",
] as const;

const INVENTORY: Product[] = [
  {
    id: "sauce-labs-backpack",
    name: "Sauce Labs Backpack",
    desc: "Carry allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.",
    price: 29.99,
    emoji: "🎒",
  },
  {
    id: "sauce-labs-bike-light",
    name: "Sauce Labs Bike Light",
    desc: "A red light is not the desired state in testing but it sure helps when riding your bike at night.",
    price: 9.99,
    emoji: "🚲",
  },
  {
    id: "sauce-labs-bolt-t-shirt",
    name: "Sauce Labs Bolt T-Shirt",
    desc: "Get your testing superhero on with the Sauce Labs bolt T-shirt from American Apparel.",
    price: 15.99,
    emoji: "👕",
  },
  {
    id: "sauce-labs-fleece-jacket",
    name: "Sauce Labs Fleece Jacket",
    desc: "A cozy midweight quarter-zip fleece jacket capable of handling everything from relaxing day outs to busy office sessions.",
    price: 49.99,
    emoji: "🧥",
  },
  {
    id: "sauce-labs-onesie",
    name: "Sauce Labs Onesie",
    desc: "Rib snap infant onesie for the junior automation engineer in development.",
    price: 7.99,
    emoji: "🧸",
  },
  {
    id: "test.allthethings()-t-shirt-(red)",
    name: "Test.allTheThings() T-Shirt (Red)",
    desc: "This classic Sauce Labs tee is perfect to wear when coding your strongest assertions.",
    price: 15.99,
    emoji: "🟥",
  },
];

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function MockSaucedemoPage() {
  const [screen, setScreen] = useState<Screen>("login");
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [sort, setSort] = useState<SortMode>("az");
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const cartItems = useMemo(() => {
    const wanted = new Set(cartIds);
    return INVENTORY.filter((p) => wanted.has(p.id));
  }, [cartIds]);

  const sortedInventory = useMemo(() => {
    const list = [...INVENTORY];
    if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "za") list.sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "lohi") list.sort((a, b) => a.price - b.price);
    if (sort === "hilo") list.sort((a, b) => b.price - a.price);
    return list;
  }, [sort]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const inStore = screen !== "login";

  const toggleCart = (id: string) => {
    setCartIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const resetCheckout = () => {
    setFirstName("");
    setLastName("");
    setPostalCode("");
    setCheckoutError("");
  };

  const logout = () => {
    setScreen("login");
    setMenuOpen(false);
    setUsername("");
    setPassword("");
    setLoginError("");
    setCartIds([]);
    resetCheckout();
  };

  const doLogin = () => {
    const user = username.trim();
    if (!user) return setLoginError("Username is required");
    if (!password) return setLoginError("Password is required");
    if (password !== "secret_sauce") {
      return setLoginError("Username and password do not match any user");
    }
    if (!ACCEPTED_USERS.includes(user as (typeof ACCEPTED_USERS)[number])) {
      return setLoginError("Username and password do not match any user");
    }
    if (user === "locked_out_user") {
      return setLoginError("Sorry, this user has been locked out.");
    }
    setLoginError("");
    setScreen("inventory");
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-[#132322]">
      <header className="sticky top-0 z-20 border-b border-[#d8dde0] bg-white">
        <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded p-1.5 text-[#132322] hover:bg-[#eef1f3]"
            aria-label="Open menu"
            data-test="react-burger-menu-btn"
          >
            ☰
          </button>
          <h1 className="text-3xl font-light tracking-[0.18em]">Swag Labs</h1>
          <button
            type="button"
            onClick={() => inStore && setScreen("cart")}
            disabled={!inStore}
            className="relative rounded p-1.5 text-xl disabled:opacity-50"
            aria-label="Shopping cart"
          >
            🛒
            {cartIds.length > 0 && (
              <span className="absolute -right-0.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e2231a] px-1 text-[11px] font-semibold text-white">
                {cartIds.length}
              </span>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute left-2 top-16 z-30 w-56 border border-[#d8dde0] bg-white shadow-lg">
            <button
              type="button"
              onClick={() => {
                if (inStore) setScreen("inventory");
                setMenuOpen(false);
              }}
              className="block w-full border-b border-[#eef1f3] px-4 py-2 text-left text-sm hover:bg-[#eef1f3]"
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="block w-full border-b border-[#eef1f3] px-4 py-2 text-left text-sm hover:bg-[#eef1f3]"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => {
                setCartIds([]);
                setMenuOpen(false);
              }}
              className="block w-full border-b border-[#eef1f3] px-4 py-2 text-left text-sm hover:bg-[#eef1f3]"
            >
              Reset App State
            </button>
            <button
              type="button"
              onClick={logout}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-[#eef1f3]"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {screen === "login" && (
        <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-10">
          <section className="rounded-lg border border-[#d8dde0] bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded border border-[#c7d0d5] px-3 py-2 text-lg outline-none focus:border-[#3a838f]"
                placeholder="Username"
                data-test="username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded border border-[#c7d0d5] px-3 py-2 text-lg outline-none focus:border-[#3a838f]"
                placeholder="Password"
                data-test="password"
              />
              {loginError && (
                <div className="rounded bg-[#e2231a] px-3 py-2 text-sm font-semibold text-white">
                  Epic sadface: {loginError}
                </div>
              )}
              <button
                type="button"
                onClick={doLogin}
                className="rounded bg-[#3ddc97] px-4 py-2 text-xl font-medium text-[#13352f] hover:brightness-95"
                data-test="login-button"
              >
                Login
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-[#d8dde0] bg-[#0f2330] p-5 text-[#f7fbfd]">
            <p className="mb-2 text-lg font-semibold">Accepted usernames are:</p>
            <ul className="space-y-1 text-base">
              {ACCEPTED_USERS.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <p className="mt-4 text-lg font-semibold">Password for all users:</p>
            <p className="text-base">secret_sauce</p>
          </section>
        </main>
      )}

      {screen === "inventory" && (
        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-light">Products</h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="rounded border border-[#c7d0d5] bg-white px-3 py-2 text-sm"
              data-test="product-sort-container"
            >
              <option value="az">Name (A to Z)</option>
              <option value="za">Name (Z to A)</option>
              <option value="lohi">Price (low to high)</option>
              <option value="hilo">Price (high to low)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedInventory.map((product) => {
              const inCart = cartIds.includes(product.id);
              return (
                <article key={product.id} className="grid grid-cols-[120px_1fr] overflow-hidden rounded-lg border border-[#d8dde0] bg-white">
                  <div className="flex items-center justify-center bg-[#f1f4f5] text-6xl">
                    {product.emoji}
                  </div>
                  <div className="flex flex-col gap-2 p-4">
                    <h3 className="text-2xl font-light text-[#2f5f66]">{product.name}</h3>
                    <p className="text-sm text-[#3b4f50]">{product.desc}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-3xl font-light">{money(product.price)}</span>
                      <button
                        type="button"
                        onClick={() => toggleCart(product.id)}
                        className={`rounded border px-5 py-1.5 text-sm uppercase tracking-wide ${
                          inCart
                            ? "border-[#e2231a] text-[#e2231a]"
                            : "border-[#333] text-[#333]"
                        }`}
                        data-test={`${inCart ? "remove" : "add-to-cart"}-${product.id}`}
                      >
                        {inCart ? "Remove" : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      )}

      {screen === "cart" && (
        <main className="mx-auto max-w-6xl px-4 py-6">
          <h2 className="mb-4 text-3xl font-light">Your Cart</h2>
          <div className="space-y-3">
            {cartItems.length === 0 && (
              <div className="rounded border border-[#d8dde0] bg-white p-5 text-sm text-[#4b5f61]">
                Your cart is empty. Add some items from inventory.
              </div>
            )}
            {cartItems.map((item) => (
              <article key={item.id} className="rounded border border-[#d8dde0] bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-2xl font-light text-[#2f5f66]">{item.name}</h3>
                  <button
                    type="button"
                    onClick={() => toggleCart(item.id)}
                    className="rounded border border-[#e2231a] px-5 py-1.5 text-sm uppercase tracking-wide text-[#e2231a]"
                    data-test={`remove-${item.id}`}
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm text-[#3b4f50]">{item.desc}</p>
                <p className="mt-3 text-3xl font-light">{money(item.price)}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex justify-between">
            <button
              type="button"
              onClick={() => setScreen("inventory")}
              className="rounded border border-[#333] px-4 py-2 text-sm uppercase"
              data-test="continue-shopping"
            >
              Continue Shopping
            </button>
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={() => {
                setCheckoutError("");
                setScreen("checkout-step-one");
              }}
              className="rounded border border-[#333] px-4 py-2 text-sm uppercase disabled:opacity-50"
              data-test="checkout"
            >
              Checkout
            </button>
          </div>
        </main>
      )}

      {screen === "checkout-step-one" && (
        <main className="mx-auto max-w-3xl px-4 py-6">
          <h2 className="mb-4 text-3xl font-light">Checkout: Your Information</h2>
          <div className="rounded border border-[#d8dde0] bg-white p-5">
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rounded border border-[#c7d0d5] px-3 py-2"
                placeholder="First Name"
                data-test="firstName"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rounded border border-[#c7d0d5] px-3 py-2"
                placeholder="Last Name"
                data-test="lastName"
              />
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="rounded border border-[#c7d0d5] px-3 py-2"
                placeholder="Zip/Postal Code"
                data-test="postalCode"
              />
              {checkoutError && (
                <div className="rounded bg-[#e2231a] px-3 py-2 text-sm font-semibold text-white">
                  {checkoutError}
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setCheckoutError("");
                  setScreen("cart");
                }}
                className="rounded border border-[#333] px-4 py-2 text-sm uppercase"
                data-test="cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!firstName.trim() || !lastName.trim() || !postalCode.trim()) {
                    setCheckoutError("Error: All fields are required");
                    return;
                  }
                  setCheckoutError("");
                  setScreen("checkout-step-two");
                }}
                className="rounded border border-[#333] px-4 py-2 text-sm uppercase"
                data-test="continue"
              >
                Continue
              </button>
            </div>
          </div>
        </main>
      )}

      {screen === "checkout-step-two" && (
        <main className="mx-auto max-w-4xl px-4 py-6">
          <h2 className="mb-4 text-3xl font-light">Checkout: Overview</h2>
          <div className="rounded border border-[#d8dde0] bg-white p-5">
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="border-b border-[#eef1f3] pb-2 last:border-b-0">
                  <h3 className="text-xl font-light text-[#2f5f66]">{item.name}</h3>
                  <p className="text-sm text-[#3b4f50]">{item.desc}</p>
                  <p className="mt-1 text-lg">{money(item.price)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-[#d8dde0] pt-4 text-sm">
              <p>Item total: {money(subtotal)}</p>
              <p>Tax: {money(tax)}</p>
              <p className="mt-1 text-lg font-semibold">Total: {money(total)}</p>
            </div>
            <div className="mt-5 flex justify-between">
              <button
                type="button"
                onClick={() => setScreen("inventory")}
                className="rounded border border-[#333] px-4 py-2 text-sm uppercase"
                data-test="cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartIds([]);
                  resetCheckout();
                  setScreen("checkout-complete");
                }}
                className="rounded border border-[#333] px-4 py-2 text-sm uppercase"
                data-test="finish"
              >
                Finish
              </button>
            </div>
          </div>
        </main>
      )}

      {screen === "checkout-complete" && (
        <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center">
          <div className="mb-2 text-6xl">✅</div>
          <h2 className="text-3xl font-light">Thank you for your order!</h2>
          <p className="mt-2 text-sm text-[#3b4f50]">
            Your fake Saucedemo checkout is complete. Keep testing interactions.
          </p>
          <button
            type="button"
            onClick={() => setScreen("inventory")}
            className="mt-6 rounded border border-[#333] px-5 py-2 text-sm uppercase"
            data-test="back-to-products"
          >
            Back Home
          </button>
        </main>
      )}
    </div>
  );
}
