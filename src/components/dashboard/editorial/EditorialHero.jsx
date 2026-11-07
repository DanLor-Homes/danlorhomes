import React from 'react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { HERO_IMAGE } from './assets';

export default function EditorialHero({ pipelineValue }) {
  return (
    <div className="ed-hero">
      <Image src={HERO_IMAGE} alt="" className="ed-hero-img" fittingType="fill" />
      <div className="ed-scrim" />
      <div className="ed-hc">
        <div className="ed-hr">
          <div>
            <p className="ed-sc ed-date">Resumen comercial</p>
            <h1>Panel de control</h1>
            <p className="ed-d">Estado del embudo, rendimiento del equipo y avisos automáticos de seguimiento.</p>
          </div>
          <Link to="/pipeline" className="ed-btn">
            Ver pipeline →
          </Link>
        </div>
        <div className="ed-big">{pipelineValue}</div>
        <p className="ed-sc ed-bl">Pipeline abierto</p>
      </div>
    </div>
  );
}