-- Seed file for Interests and Regions
-- Run this in your Supabase SQL Editor if your tables are empty.

INSERT INTO public.interests (id, name) VALUES 
  ('952c21db-e1d4-46c9-953e-ea568bc6b732', 'Cine'),
  ('b7138663-39d5-41f7-bcea-18ed18fc52e3', 'Bares'),
  ('785abfbb-f3fa-4237-aab1-74fd7722263b', 'Museos'),
  ('4517d177-8e2d-497d-8f3a-a3fb3998c8b6', 'Picnic'),
  ('fa1b9ef6-00c0-45ce-a231-fd0ec6e3c312', 'Running'),
  ('665b2366-5210-445e-badd-553542d3d7ba', 'Cafés'),
  ('afef8eaa-0bf8-4214-8164-36ae48ba9014', 'Gaming'),
  ('90470d9e-cdc5-4efb-b989-01449c70260f', 'Lectura'),
  ('0df6df4d-b074-48a9-98fc-7da05340b659', 'Música'),
  ('bd263c8c-ac60-4801-ab83-863e957d61d8', 'Teatro')
ON CONFLICT (id) DO NOTHING;

-- Regions and their corresponding Rooms
INSERT INTO public.rooms (id, type) VALUES 
  ('834385f5-26a0-4cf6-b655-0aa994bbac77', 'region'),
  ('9c8961c8-8dc0-4ff5-8925-ff76eb13bf00', 'region'),
  ('4c7d0e14-0775-4046-a5b2-973463b895ac', 'region'),
  ('2097f2e3-abed-4d8c-8000-a06edbee08a2', 'region'),
  ('321a455d-f80a-41e7-b35f-a32aa465a97d', 'region'),
  ('12522fc1-adb1-447b-9bc9-98d2c588639f', 'region'),
  ('85741e65-4a5c-4b60-8655-370c56362690', 'region')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.regions (id, name, room_id) VALUES 
  ('4f697c97-758f-40f6-91d6-0532e6eeace8', 'CABA', '834385f5-26a0-4cf6-b655-0aa994bbac77'),
  ('b490978c-d607-48ba-8b21-5c1ce3108c54', 'GBA Norte', '9c8961c8-8dc0-4ff5-8925-ff76eb13bf00'),
  ('308b1ab3-ae4d-4974-a378-c0465b578e11', 'GBA Sur', '4c7d0e14-0775-4046-a5b2-973463b895ac'),
  ('3d31f36e-1ff9-4cf6-93f5-92d3ace79190', 'GBA Oeste', '2097f2e3-abed-4d8c-8000-a06edbee08a2'),
  ('b4db82e9-98cc-4b8d-ae75-cfcd9c3c2401', 'Córdoba', '321a455d-f80a-41e7-b35f-a32aa465a97d'),
  ('610a4050-fc55-48cc-8cd6-830fe0bef435', 'Mendoza', '12522fc1-adb1-447b-9bc9-98d2c588639f'),
  ('47909995-8090-4141-9354-00010a911e77', 'Rosario', '85741e65-4a5c-4b60-8655-370c56362690')
ON CONFLICT (id) DO NOTHING;
