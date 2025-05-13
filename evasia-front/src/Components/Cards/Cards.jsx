import React from "react";
import './Cards.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Cards = ({ title, quantidade, icon, porcentagem, informacao }) => {
    return (
        <div className="card">
            <div className="card-header">
                <FontAwesomeIcon icon={icon} className="icon" />
                <h2>{title}</h2>
            </div>

            <div className="card-body">
                <h1>{quantidade}</h1>
                <p>
                    <span className="porcentagem">{porcentagem}</span>
                    {informacao}
                </p>
            </div>
        </div>
    );
};

export default Cards;
