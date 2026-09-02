-- =====================================================================
-- 0003: corrige dos bugs de visibilidad curso ↔ estudiante ↔ evaluación.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Bug 1: evaluaciones.curso_id es el curso "de origen" (obligatorio al
-- crear), pero la tabla asignaciones existe para sumar cursos
-- adicionales. La política evaluaciones_select solo miraba curso_id,
-- así que un estudiante de un curso agregado únicamente vía
-- "asignaciones" nunca podía ver (ni rendir) la evaluación aunque el
-- panel del docente dijera "asignada".
-- ---------------------------------------------------------------------
drop policy if exists evaluaciones_select on evaluaciones;
create policy evaluaciones_select on evaluaciones for select using (
  es_admin()
  or es_docente_de_curso(curso_id)
  or es_estudiante_de_curso(curso_id)
  or exists (
    select 1 from asignaciones a
    where a.evaluacion_id = evaluaciones.id and es_estudiante_de_curso(a.curso_id)
  )
);

-- ---------------------------------------------------------------------
-- Bug 2: la política perfiles_select original exigía que EL DOCENTE
-- tuviera su propia fila en curso_integrantes con rol_en_curso='docente'
-- para poder ver los perfiles de los integrantes de ese curso. La app
-- real (crearCurso) nunca crea esa fila: solo guarda
-- cursos.docente_titular_id. Resultado: un docente titular nunca podía
-- leer nombre/apellido/correo de sus propios estudiantes (la fila de
-- curso_integrantes sí era visible, pero el perfil vinculado no), que es
-- la causa de "no puedo ver qué estudiantes pertenecen a ese curso".
-- es_docente_de_curso() ya contempla docente_titular_id y la fila de
-- curso_integrantes, así que se reemplaza el self-join por esa función.
-- ---------------------------------------------------------------------
drop policy if exists perfiles_select on perfiles;
create policy perfiles_select on perfiles for select using (
  id = auth.uid()
  or es_admin()
  or exists (
    select 1 from curso_integrantes ci
    where ci.perfil_id = perfiles.id and es_docente_de_curso(ci.curso_id)
  )
);
