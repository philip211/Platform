import "./ShopPage.scss"

const mockBoosts = [
  { id: 1, title: "🔮 Удвоение монет", description: "Х2 к монетам на 1 час", price: 100 },
  { id: 2, title: "🎭 Скрыть роль", description: "Твоя роль будет невидима", price: 200 },
  { id: 3, title: "🚀 Быстрый старт", description: "Начинай игру сразу", price: 150 },
]

const ShopPage = () => {
  return (
    <div className="shop-page">
      <h1 className="shop-page__title">🛍 Магазин бустов</h1>
      <div className="shop-page__list">
        {mockBoosts.map((boost) => (
          <div key={boost.id} className="shop-page__item">
            <h3 className="shop-page__item-title">{boost.title}</h3>
            <p className="shop-page__item-desc">{boost.description}</p>
            <div className="shop-page__item-footer">
              <span className="shop-page__item-price">{boost.price} 🪙</span>
              <button className="shop-page__item-button">Купить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ShopPage
