-- ========================================================================
-- CampusPath — Sample Demo Dataset Seed Script
-- WARNING: This is synthetic DEMO DATA for testing and prototyping.
-- Replace with actual surveyed college floor coordinates before live deployment.
-- ========================================================================

-- Insert Floors
insert into public.floors (id, name, map_url, notes) values
  (0, 'Ground Floor', null, 'Main entrance level with administrative offices and classrooms'),
  (1, 'First Floor', null, 'Computer Science department and seminar rooms'),
  (2, 'Second Floor', null, 'Specialized laboratories and digital library')
on conflict (id) do update set
  name = excluded.name,
  notes = excluded.notes;

-- Insert Nodes (Permanent IDs)
insert into public.nodes (id, floor_id, name, x, y, type, accessible, description) values
  -- Floor 0 (Ground)
  ('GATE_MAIN', 0, 'Main Entrance Gate', 80, 330, 'gate', true, 'Campus main pedestrian entrance checkpoint'),
  ('G_J1', 0, 'Ground Corridor Central', 260, 330, 'junction', true, 'Central corridor intersection near stairs'),
  ('G_CORR_WEST', 0, 'Ground Corridor West', 170, 330, 'junction', true, 'Corridor junction near admin block'),
  ('G_STAIRS', 0, 'Ground Floor Stairs', 440, 330, 'stairs', false, 'Main staircase connecting floors 0, 1, 2'),
  ('G_LIFT', 0, 'Ground Floor Elevator', 440, 370, 'lift', true, 'Wheelchair-accessible elevator'),
  ('G_F16', 0, 'Lecture Hall 101 (F-16)', 260, 170, 'room', true, 'Ground floor 60-seat lecture hall'),
  ('G_F21', 0, 'Physics Seminar Room (F-21)', 440, 170, 'room', true, 'Physics department presentation room'),
  ('G_ADMIN', 0, 'Dean / Admin Office', 170, 170, 'office', true, 'Administrative office and reception'),
  ('G_RESTROOM', 0, 'Ground Restrooms', 80, 170, 'restroom', true, 'Accessible male/female restrooms'),

  -- Floor 1
  ('F1_STAIRS', 1, 'First Floor Stairs', 440, 330, 'stairs', false, 'Staircase landing on first floor'),
  ('F1_LIFT', 1, 'First Floor Elevator', 440, 370, 'lift', true, 'Wheelchair-accessible elevator landing'),
  ('F1_J1', 1, 'First Floor Corridor Central', 260, 330, 'junction', true, 'Central hall connecting rooms S-34 and S-36'),
  ('F1_CORR_WEST', 1, 'First Floor Corridor West', 170, 330, 'junction', true, 'Corridor near Computer Science staff room'),
  ('F1_S34', 1, 'Classroom S-34', 260, 170, 'room', true, 'First floor multimedia classroom'),
  ('F1_S36', 1, 'Classroom S-36', 80, 170, 'room', true, 'First floor electronics classroom'),
  ('F1_DEPT_CS', 1, 'Computer Science Dept Office', 170, 170, 'office', true, 'Department head and faculty workstations'),
  ('F1_RESTROOM', 1, 'First Floor Restrooms', 80, 240, 'restroom', true, 'Restrooms near west corridor'),

  -- Floor 2
  ('F2_STAIRS', 2, 'Second Floor Stairs', 440, 330, 'stairs', false, 'Staircase landing on second floor'),
  ('F2_LIFT', 2, 'Second Floor Elevator', 440, 370, 'lift', true, 'Wheelchair-accessible elevator landing'),
  ('F2_J1', 2, 'Second Floor Corridor Central', 260, 330, 'junction', true, 'Central junction leading to labs and library'),
  ('F2_LAB', 2, 'Computer Science Lab 201', 260, 170, 'lab', true, 'Network and algorithms computing lab'),
  ('F2_LAB_204', 2, 'AI & Robotics Lab 204', 440, 170, 'lab', true, 'Advanced artificial intelligence research lab'),
  ('F2_LIBRARY', 2, 'Digital Reading Room & Library', 80, 170, 'room', true, 'Quiet study area and digital journals')
on conflict (id) do update set
  name = excluded.name,
  x = excluded.x,
  y = excluded.y,
  type = excluded.type,
  accessible = excluded.accessible,
  description = excluded.description;

-- Insert Edges (Physical walkable connections)
insert into public.edges (a, b, distance_m, type, accessible, directed) values
  -- Floor 0 internal
  ('GATE_MAIN', 'G_CORR_WEST', 9, 'walk', true, false),
  ('G_CORR_WEST', 'G_J1', 9, 'walk', true, false),
  ('G_J1', 'G_STAIRS', 18, 'walk', true, false),
  ('G_J1', 'G_LIFT', 19, 'walk', true, false),
  ('G_J1', 'G_F16', 12, 'walk', true, false),
  ('G_STAIRS', 'G_F21', 12, 'walk', true, false),
  ('G_CORR_WEST', 'G_ADMIN', 12, 'walk', true, false),
  ('GATE_MAIN', 'G_RESTROOM', 12, 'walk', true, false),

  -- Floor transitions: Stairs (not accessible) & Lifts (accessible)
  ('G_STAIRS', 'F1_STAIRS', 6, 'stairs', false, false),
  ('F1_STAIRS', 'F2_STAIRS', 6, 'stairs', false, false),
  ('G_LIFT', 'F1_LIFT', 8, 'lift', true, false),
  ('F1_LIFT', 'F2_LIFT', 8, 'lift', true, false),

  -- Floor 1 internal
  ('F1_STAIRS', 'F1_J1', 18, 'walk', true, false),
  ('F1_LIFT', 'F1_J1', 19, 'walk', true, false),
  ('F1_J1', 'F1_CORR_WEST', 9, 'walk', true, false),
  ('F1_J1', 'F1_S34', 12, 'walk', true, false),
  ('F1_CORR_WEST', 'F1_S36', 15, 'walk', true, false),
  ('F1_CORR_WEST', 'F1_DEPT_CS', 12, 'walk', true, false),
  ('F1_CORR_WEST', 'F1_RESTROOM', 10, 'walk', true, false),

  -- Floor 2 internal
  ('F2_STAIRS', 'F2_J1', 18, 'walk', true, false),
  ('F2_LIFT', 'F2_J1', 19, 'walk', true, false),
  ('F2_J1', 'F2_LAB', 12, 'walk', true, false),
  ('F2_STAIRS', 'F2_LAB_204', 12, 'walk', true, false),
  ('F2_J1', 'F2_LIBRARY', 18, 'walk', true, false);

-- Insert Searchable Places / Directory
insert into public.places (node_id, name, aliases, department, category) values
  ('GATE_MAIN', 'Campus Main Gate', '{"Entrance", "Security Gate", "Gate 1"}', 'Campus Security', 'facility'),
  ('G_F16', 'Room 101 (F-16)', '{"Lecture Hall 101", "Classroom 101", "F16", "Room F-16"}', 'General Academics', 'classroom'),
  ('G_F21', 'Room 102 (F-21)', '{"Physics Room", "Seminar Hall", "F21", "Room F-21"}', 'Physics Department', 'classroom'),
  ('G_ADMIN', 'Dean Office & Administration', '{"Dean", "Principal Office", "Registrar", "Admin Desk"}', 'Administration', 'office'),
  ('G_RESTROOM', 'Ground Floor Restroom', '{"Washroom", "Toilet", "Restroom"}', 'Facilities', 'restroom'),

  ('F1_S34', 'Classroom S-34', '{"S34", "Room S34", "CS Classroom 1", "S-34"}', 'Computer Science', 'classroom'),
  ('F1_S36', 'Classroom S-36', '{"S36", "Room S36", "Electronics Room", "S-36"}', 'Electronics Department', 'classroom'),
  ('F1_DEPT_CS', 'Computer Science HOD & Faculty', '{"CS Department", "HOD CS", "Professors Room"}', 'Computer Science', 'office'),
  ('F1_RESTROOM', 'First Floor Restroom', '{"1st Floor Washroom", "Restroom"}', 'Facilities', 'restroom'),

  ('F2_LAB', 'Computer Lab 201', '{"Lab 1", "Programming Lab", "Linux Lab", "CS Lab"}', 'Computer Science', 'lab'),
  ('F2_LAB_204', 'AI & Robotics Lab 204', '{"Robotics Lab", "AI Lab", "Machine Learning Lab", "Lab 204"}', 'Computer Science / AI', 'lab'),
  ('F2_LIBRARY', 'Digital Library & Reading Room', '{"Library", "Study Hall", "Reading Room", "Books"}', 'Library Services', 'facility');

