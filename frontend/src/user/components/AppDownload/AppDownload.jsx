import React from 'react'
import './AppDownload.css'
import { assets } from '../../assets/assets'

const AppDownload = () => {
  return (
    <div className='app-download' id='app-download'>
      <p>Get the KIITEats experience on your phone <br />for faster ordering, slot booking and live tracking</p>
      <div className='app-download-platforms'>
        <img src={assets.play_store} alt='Play Store' />
        <img src={assets.app_store} alt='App Store' />
      </div>
    </div>
  )
}

export default AppDownload
