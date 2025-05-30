import React from 'react';
import './Spiner.scss';

const Spiner = () => {
    return (
        <div className='spiner'>
            <svg viewBox="25 25 50 50">
                <circle r="20" cy="50" cx="50"></circle>
            </svg>
        </div>
    )
}

export default Spiner
