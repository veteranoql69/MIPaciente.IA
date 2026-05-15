# Catálogo de Servicios y Procedimientos (Urología Staging)

Este catálogo representa los servicios cargados en el sistema Mi-Paciente para la Clínica Urología Demo, según el script de inicialización `reset_and_seed_staging.sql`.

## 🏥 Cirugías (Bloquean Pabellón)

Las cirugías requieren asignación de equipo quirúrgico completo y uso de pabellón.

| Nombre | Duración | Precio Base | Categoría |
| :--- | :--- | :--- | :--- |
| **Nefrolitotomía Percutánea** | 120 min | $2,500,000 | Cirugía Mayor |
| **HoLEP — Enucleación Láser** | 90 min | $2,200,000 | Cirugía Mayor |
| **Uretroplastia** | 90 min | $1,500,000 | Cirugía Ambulatoria |
| **Ureteroscopia Rígida (URS)** | 60 min | $900,000 | Cirugía Mayor |
| **Circuncisión Adulto ZSR** | 25 min | $590,000 | Cirugía Ambulatoria |
| **Orquidopexia** | 50 min | $580,000 | Cirugía Ambulatoria |
| **Extracción Quiste Epididimario** | 45 min | $520,000 | Cirugía Ambulatoria |
| **Vasectomía sin Bisturí** | 25 min | $490,000 | Cirugía Ambulatoria |
| **Circuncisión con Suturas** | 45 min | $490,000 | Cirugía Ambulatoria |

## 🔬 Procedimientos Médicos

Suelen realizarse en salas de procedimientos o box clínico especializado.

| Nombre | Duración | Precio Base | Categoría |
| :--- | :--- | :--- | :--- |
| **Próstata Rezum (Vapor de Agua)** | 60 min | $1,800,000 | Procedimiento |
| **Biopsia Próstata por Fusión** | 45 min | $890,000 | Procedimiento |
| **Litotricia Extracorpórea (LEOC)**| 45 min | $350,000 | Procedimiento |
| **Cistoscopia Diagnóstica** | 30 min | $180,000 | Procedimiento |

## 🩺 Consultas y Controles

Servicios estándar de atención en box.

| Nombre | Duración | Precio Base | Categoría |
| :--- | :--- | :--- | :--- |
| **Segunda Opinión Urológica** | 30 min | $70,000 | Consulta |
| **Consulta Urológica General** | 20 min | $55,000 | Consulta |
| **Control Post-Operatorio** | 15 min | $30,000 | Control |

---
**Fuente:** `reset_and_seed_staging.sql`  
**Fecha de actualización:** 12 de mayo de 2026
