import React from 'react'
import './LoadingCards.scss'

const LoadingCards = () => {
    return (
        <div className="card-loader">
            <div className="loader-wrapper">
                <div className="loader-icon"></div>
                <div className="loader-line-1"></div>
                <div className="loader-line-2"></div>
                <div className="loader-line-3"></div>
            </div>
        </div>
    )
}

export default LoadingCards