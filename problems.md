People are approaching hospitals with AI solutions, we give hospitals the tools to test and verify these quickly. 
Everything, Ambient scribes, ML models used by radiologists. Etc. 
Evaluation, benchmarking.

"People are approaching hospitals with AI solutions. We give hospitals the tools to test and verify these quickly — ambient scribes, radiology ML models, everything. Evaluation, benchmarking, monitoring."

vendor review process — procurement, IT security review, maybe a checklist. Epic has an AI governance module. Aidoc and Rad AI both have their own performance dashboards they hand you at install. So the concept of evaluating AI isn't new to them. They've been saying "we need to do this better"

Our vendor gave us a deck. It showed 94% sensitivity on a dataset from Stanford. I have no idea if that number holds on our patients — our scanner protocols, our population, our mix of pathology. I have no way to test it pre-purchase, and I have no way to monitor if it degrades after six months."

That gap is real and it is actively painful. The radiologist has almost certainly felt it. Post-deployment drift and population mismatch are the two things that actually keep clinical AI leaders up at night. The governance artifact angle (something their AI committee signs off on) is also genuinely new — most places are generating that manually in Word docs.
The pushback they'd give you:
	1	"Our IT will never let your software touch our data." — Your federated architecture answers this, but you have to lead with it. Don't make them ask.
	2	"How do you handle ground truth? We don't always agree on the label ourselves." — This is the hard radiological truth. A radiologist knows that inter-reader variability is massive. Your schema needs to account for this or they'll dismiss the whole benchmark as naive.
	3	"Who's liable if this tool says an AI passes and then it misses a cancer?" — Legal/risk question. You need a clear answer: you benchmark performance on historical labeled data, you make no clinical safety claims, no warranty of fitness for clinical deployment.
	4	"Is this HIPAA-compliant? Is it FDA-regulated?" — They'll ask even if they already know the answer. It signals maturity if you've thought it through.
Bottom line as the radiologist:
"I like this. We've needed something like this for years and nobody has built it as a service. My concern is whether you can actually get inside our firewall and whether your benchmark cases reflect real clinical distributions, not just curated public datasets. If you can demo it on our chest X-rays with our protocols, I'd bring this to the CHVI committee."

The key insight: they don't think this doesn't exist because it's not a good idea. They think it doesn't exist because it's hard to get right clinically. Your job in the pitch is to prove you understand the clinical nuance, not just the engineering.
can they just install it locally, and have it use a hosted or local model? curious if they alraedy have benchmarking software.... is this benchmarking for responses/chats?

	1	
	2	
	3	

Good questions — let me separate them out:

Can they install it locally with a hosted or local model?
Yes, that's actually the intended architecture from your memory — a MedBench Agent runs inside their firewall, only metrics leave. For the model side:
	•	Hosted: Call Claude/GPT-4o via API (data leaves firewall — hospitals hate this)
	•	Local: Run an open-source model on their own GPU (Llama 3, Mistral, etc.) — this is what enterprise health systems actually want
	•	Hybrid: Local inference, cloud dashboard — probably the most sellable path
The locally-installed-agent model is the right call. It's what MedPerf does and why hospitals actually engage with it.

Do they already have benchmarking software?
For radiology AI specifically (DICOM, imaging models, diagnostic accuracy) — not really. There's no turnkey commercial product for pre-purchase vendor evaluation. What exists:
	•	MedPerf (MLCommons) — open source, federated, but no UI, requires engineering setup
	•	FDA AIML tracker — regulatory, not operational
	•	Vendor dashboards (Aidoc, Rad AI) — they grade their own homework
	•	Internal scripts some academic centers wrote themselves
So the gap is real.

Is this benchmarking for chat/LLM responses?
This is the critical question and where you need to be clear on scope. There are actually two very different products here:
	1	Imaging AI benchmarking — does this model correctly flag the pneumothorax on this X-ray? Ground truth = radiologist label. This is what CHVI cares about day-to-day.
	2	Clinical LLM benchmarking — does this chatbot give the right differential diagnosis? Ground truth = harder to define. This is your problem #6 (AI agents doing clinical reasoning).
These are almost separate products with different buyers, different data, and different ground truth problems. Most existing benchmarks (USMLE-style, MedQA, etc.) only cover #2.
My recommendation: Lead with #1 for the CHVI pitch — it's concrete, the pain is felt, and the ground truth exists (radiology labels). Frame #2 as the roadmap.


Where Epic's lock doesn't reach (it doesn’t touch validation/monitoring)
	•	AI validation/procurement — health systems have no good way to evaluate AI tools before buying. You can be the independent lab that runs those evals (think Underwriters Lab for clinical AI)
	•	Post-deployment monitoring — FDA increasingly requires ongoing performance monitoring for AI/ML devices (see: PCCP guidance). Nobody does this well yet
^ these

Epic owns the EHR layer but they don't own:
	•	AI validation/procurement — health systems have no good way to evaluate AI tools before buying. You can be the independent lab that runs those evals (think Underwriters Lab for clinical AI)
	•	Post-deployment monitoring — FDA increasingly requires ongoing performance monitoring for AI/ML devices (see: PCCP guidance). Nobody does this well yet
	•	Specialty workflows Epic underserves — dental, behavioral health, long-term care, smaller rural systems that run Athena/eCW/Meditech
Adjacent niches with real pull
	•	Ambient documentation evals — Nuance DAX, Ambiance, Suki are all competing hard right now and health systems have no independent benchmarks for them
	•	Pathology AI — computational pathology is 2-3 years behind radiology AI adoption, same playbook applies
	•	Ophthalmology — FDA-cleared diabetic retinopathy tools (IDx-DR, etc.) are deployed but unstudied in real-world populations
	•	Sepsis/deterioration alerts — EWS tools are everywhere but notoriously miscalibrated; Epic Deterioration Index gets heavy criticism
The B2B angle (faster to revenue)
Rather than selling to health systems directly, sell to AI vendors:
	•	They need real-world validation data to close enterprise deals
	•	FDA's PCCP framework requires ongoing evals they can't do themselves
	•	This is like a CRO (contract research org) model for clinical AI
The real moat question
Epic's lock is on data flow. Your moat would be on trust and methodology — being the org that clinicians and procurement committees believe. That's a reputation/credentialing play more than a tech one. UW-Madison affiliation helps a lot here.
What's drawing you toward the benchmarking angle specifically — is it the methodology side, the relationships at UW, or something else? That'd help narrow which of these is most defensible for you.
Rather than selling to health systems directly, sell to AI vendors:
what vendors?



	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	
	•	

	•	
	•	
	•	
	•	
	•	
	•	


Here's a map by segment — ordered roughly by how much they'd need what you're building:
Radiology AI (most mature, most urgent need)
These companies have FDA clearance but need real-world performance data to close enterprise sales:
	•	Aidoc — workflow prioritization across modalities
	•	Viz.ai — stroke, PE, aortic dissection detection
	•	RapidAI — stroke imaging, LVO detection
	•	Qure.ai — chest X-ray, TB (big in global health)
	•	Lunit — mammography, chest X-ray (Korean, expanding US)
	•	Zebra Medical / Nanox — broad radiology suite
Ambient Documentation (fastest growing, least validated)
No independent benchmarks exist for any of these:
	•	Abridge (UPMC-backed, gaining fast)
	•	Nuance DAX / Microsoft — largest installed base
	•	Suki — physician-focused
	•	DeepScribe — multispecialty
	•	Ambiance Healthcare
Pathology AI (2-3 years behind radiology)
	•	PathAI — oncology, drug development
	•	Paige.ai — first FDA-cleared pathology AI
	•	Ibex Medical — prostate, GI cancer detection
Ophthalmology
	•	Digital Diagnostics (IDx-DR) — first FDA-cleared autonomous AI diagnostic, diabetic retinopathy
	•	Eyenuk — similar space
Clinical Decision Support / Sepsis
	•	Cohere Health — prior authorization AI
	•	Potrero Medical — AKI prediction

Who has the most urgency right now
The ambient scribing companies are in a land-grab moment with zero independent validation — that's the sharpest wedge. Radiology AI vendors are further along but actively losing deals because procurement committees don't trust vendor-supplied performance numbers.
The pitch to any of these: "We give you third-party validation data you can show a health system CMO that isn't from your own marketing deck."