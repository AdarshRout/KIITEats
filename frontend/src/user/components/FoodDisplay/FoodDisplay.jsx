import  { useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import { StoreContext } from '../../Context/StoreContext.js'
import SkeletonCard from '../SkeletonCard/SkeletonCard'

const FoodDisplay = ({ category }) => {
  const { food_list, vegOnly } = useContext(StoreContext)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(timer)
  }, [category, vegOnly])

  const filteredFood = useMemo(() => {
    const filtered = food_list.filter((item) => {
      const matchesCategory = category === 'All' || category === item.food_category
      const matchesVeg = !vegOnly || item.food_type === 'Veg'
      return matchesCategory && matchesVeg
    })

    const uniqueItems = []
    const seenNames = new Set()

    for (const item of filtered) {
      if (!seenNames.has(item.food_name)) {
        seenNames.add(item.food_name)
        uniqueItems.push(item)
      }
      if (uniqueItems.length >= 25) break
    }

    return uniqueItems
  }, [food_list, category, vegOnly])

  return (
    <div className='food-display' id='food-display'>
      <div className='food-display-heading'>
        <div>
          <h2>Top dishes near you</h2>
          <p>{vegOnly ? 'Showing only veg dishes' : 'Showing all dishes and vendors'}</p>
        </div>
        <span>{filteredFood.length} items</span>
      </div>
      <div className='food-display-list'>
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : filteredFood.map((item) => (
              <FoodItem
                key={item.food_id}
                image={item.food_image}
                name={item.food_name}
                desc={item.food_desc}
                price={item.food_price}
                id={item.food_id}
                type={item.food_type}
                calories={item.calories}
                vendor={item.vendor.name}
                rating={item.rating}
              />
            ))}
      </div>
    </div>
  )
}

FoodDisplay.propTypes = {
  category: PropTypes.string.isRequired,
}

export default FoodDisplay
