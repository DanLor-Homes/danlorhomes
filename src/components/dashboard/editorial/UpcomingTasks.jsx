import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, todayISO } from '@/lib/crm';

export default function UpcomingTasks({ tasks }) {
  return (
    <section className="ed-sec ed-d4">
      <div className="ed-sh">
        <h3>Próximas tareas</h3>
        <Link to="/tareas" className="ed-lk">
          Todas
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p className="ed-ok">Sin tareas pendientes.</p>
      ) : (
        tasks.map((task) => {
          const overdue = task.due_date < todayISO();
          return (
            <div key={task.id} className="ed-tk">
              <p className="ed-n">{task.title}</p>
              <p className="ed-s">
                {overdue ? 'Vencida · ' : ''}
                {formatDate(task.due_date)}
                {task.assignee ? ` · ${task.assignee}` : ''}
              </p>
            </div>
          );
        })
      )}
    </section>
  );
}