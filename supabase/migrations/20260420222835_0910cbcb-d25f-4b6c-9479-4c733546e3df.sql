
-- Create the trigger that was missing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert the missing profile for the existing user
INSERT INTO public.profiles (user_id, name, verification_email)
SELECT '55f74118-0597-46dc-b1d6-bee51078eb76', 'Rita Acisobi', 'acisobic.acisobi@mail.utoronto.ca'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE user_id = '55f74118-0597-46dc-b1d6-bee51078eb76'
);
