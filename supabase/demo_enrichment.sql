-- Explicit fictional demo content; never change reviewed non-demo records.
update advisors set summary='Example advisor profile for exploring study paths, comparing course requirements, and preparing questions. This demo does not deliver contact requests.' where is_demo and summary='';
update ads set summary='Fictional sponsored learning opportunity. This example is separate from your career suggestions.',provider_name='Example learning provider' where is_demo and summary='';
update career_roles r set suggested_next_step=case c.code
 when 'R' then 'Sketch a simple household repair and list the tools you would need.'
 when 'I' then 'Choose an everyday question and compare two possible explanations.'
 when 'A' then 'Create a poster that explains an idea you care about.'
 when 'S' then 'Plan a five-minute lesson to help someone learn a familiar skill.'
 when 'E' then 'Outline a small community project and how you would invite people to join.'
 when 'C' then 'Organize a sample weekly budget and check its totals.' end
from career_categories c where r.category_id=c.id and r.is_demo and r.suggested_next_step is null;
