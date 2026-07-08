export default function VendorEditItem({
  editingId,
  form,
  setForm,
  submitItem,
}) {
  return (
    <section className="panel section-card">
      <h2>{editingId ? "Edit Item" : "Add Item"}</h2>

      <form onSubmit={submitItem}>
        <div className="form-grid">
          <div className="field">
            <label>Food Name</label>
            <input
              className="input-surface"
              placeholder="Food name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>

          <div className="field">
            <label>Price (₹)</label>
            <input
              className="input-surface"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value })
              }
              required
              min="1"
            />
          </div>

          <div className="field">
            <label>Stock</label>
            <input
              className="input-surface"
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: e.target.value })
              }
              required
              min="0"
            />
          </div>

          <div className="field">
            <label>Category</label>
            <select
              className="select-surface"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option>Rolls</option>
              <option>Beverages</option>
              <option>Meals</option>
              <option>Desserts</option>
              <option>Snacks</option>
              <option>Main Course</option>
              <option>Salad</option>
              <option>Sandwich</option>
              <option>Pasta</option>
              <option>Noodles</option>
            </select>
          </div>

          <div className="field full">
            <label>Description</label>
            <input
              className="input-surface"
              placeholder="Short description (optional)"
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="field full">
            <label>Image URL</label>
            <input
              className="input-surface"
              placeholder="https://example.com/image.jpg (optional)"
              value={form.image_url || ""}
              onChange={(e) =>
                setForm({ ...form, image_url: e.target.value })
              }
            />
          </div>
        </div>

        <button className="primary-btn" type="submit">
          {editingId ? "Update Item" : "Add Item"}
        </button>
      </form>
    </section>
  );
}