import React, { useState } from 'react'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import VendorSection from '../../components/VendorSection/VendorSection'

const Home = () => {
  const [category, setCategory] = useState('All')

  return (
    <>
      <Header />
      <VendorSection />
      <ExploreMenu setCategory={setCategory} category={category} />
      <FoodDisplay category={category} />
      <AppDownload />
    </>
  )
}

export default Home
