// app/api/dosha/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getKundli } from '@/lib/firebase/admin';
import type { ApiResponse, DoshaStatus, KundliData, RemedyPlan } from '@/types';

// Full remedy database
const REMEDY_DATABASE: Record<keyof DoshaStatus, RemedyPlan> = {
  manglik: {
    dosha:          'manglik',
    gemstone:       'Red Coral (Moonga)',
    gemstoneDetails: '5–7 carats in gold/copper on ring finger on Tuesday morning',
    mantra:         'Om Angarakaya Namah',
    mantraCount:    108,
    pooja:          'Mangal Shanti Puja',
    poojaDay:       'Tuesday',
    charity:        'Donate red lentils (masoor dal) and jaggery on Tuesdays',
    lifestyle:      [
      'Pray at Hanuman temple every Tuesday',
      'Avoid starting new ventures on Tuesdays',
      'Wear red on Tuesdays',
      'Light sesame oil lamp facing South on Tuesdays',
    ],
    yantra: 'Mangal Yantra',
    color:  'Red',
  },
  kaal_sarp: {
    dosha:          'kaal_sarp',
    gemstone:       'Hessonite (Gomed) + Cat\'s Eye (Lehsunia)',
    gemstoneDetails: 'Both worn on middle finger on Saturday',
    mantra:         'Om Namah Shivaya — Maha Mrityunjaya Mantra',
    mantraCount:    108,
    pooja:          'Kaal Sarp Dosh Puja at Trimbakeshwar or Nashik',
    poojaDay:       'Nagpanchami',
    charity:        'Donate black sesame seeds and iron items on Saturdays',
    lifestyle:      [
      'Visit Shiva temple on Mondays and pour milk on Shivling',
      'Keep silver snake idol in your puja room',
      'Recite Sarpa Sukta from Rigveda',
      'Avoid wearing black on Mondays',
    ],
    yantra: 'Kaal Sarp Yantra',
    color:  'Silver',
  },
  shani_dosha: {
    dosha:          'shani_dosha',
    gemstone:       'Blue Sapphire (Neelam)',
    gemstoneDetails: '3–5 carats in silver on middle finger, Saturday morning during Shani Hora',
    mantra:         'Om Sham Shanicharaya Namah',
    mantraCount:    108,
    pooja:          'Shani Shanti Puja every Saturday',
    poojaDay:       'Saturday',
    charity:        'Donate mustard oil, black sesame seeds, and urad dal on Saturdays to the poor',
    lifestyle:      [
      'Wear black or dark blue on Saturdays',
      'Feed crows and black dogs every day',
      'Light sesame oil lamp at Shani temple on Saturdays',
      'Recite Shani Chalisa every Saturday evening',
      'Observe partial fast on Saturdays',
    ],
    yantra: 'Shani Yantra',
    color:  'Black',
  },
  pitru_dosha: {
    dosha:          'pitru_dosha',
    gemstone:       'Ruby (Manik)',
    gemstoneDetails: '3–5 carats in gold on ring finger on Sunday morning',
    mantra:         'Om Suryaya Namah — Pitra Tarpan Mantra',
    mantraCount:    108,
    pooja:          'Pitru Paksha Shraadh Puja (annually in Ashwin month)',
    poojaDay:       'Amavasya (New Moon)',
    charity:        'Donate food and clothes to Brahmins and the poor during Pitru Paksha',
    lifestyle:      [
      'Perform Tarpan on Amavasya days',
      'Plant a Peepal tree and water it on Saturdays',
      'Serve elderly parents and grandparents with love',
      'Donate food in memory of ancestors monthly',
    ],
    yantra: 'Surya Yantra',
    color:  'Copper/Gold',
  },
  gand_mool: {
    dosha:          'gand_mool',
    gemstone:       'Pearl (Moti) or Coral (Moonga) based on Moon/Mars',
    gemstoneDetails: 'Pearl in silver on Monday; Coral in copper on Tuesday',
    mantra:         'Om Namah Shivaya — 108 times at sunrise and sunset',
    mantraCount:    108,
    pooja:          'Gand Mool Nakshatra Shanti Puja (27th day from birth)',
    poojaDay:       'When Moon returns to birth Nakshatra each month',
    charity:        'Donate white items (rice, milk, white cloth) on Mondays',
    lifestyle:      [
      'Avoid starting new ventures on Gand Mool days',
      'Regular Shiva puja at home',
      'Wear a white thread on Monday',
      'Fast on Mondays and consume only milk/white foods',
    ],
    yantra: 'Chandra Yantra',
    color:  'White',
  },
};

export async function GET(req: NextRequest) {
  try {
    const userId = await verifyToken(req);
    const kundli = await getKundli(userId) as KundliData | null;

    if (!kundli) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Generate your Kundli first.' },
        { status: 400 }
      );
    }

    const { doshas } = kundli;

    // Build remedy plans for active doshas only
    const activeRemedies: RemedyPlan[] = (Object.keys(doshas) as Array<keyof DoshaStatus>)
      .filter(key => doshas[key] === true)
      .map(key => REMEDY_DATABASE[key]);

    return NextResponse.json<ApiResponse<{
      doshas: DoshaStatus;
      activeRemedies: RemedyPlan[];
      summary: string;
    }>>({
      success: true,
      data: {
        doshas,
        activeRemedies,
        summary: buildDoshaSummary(doshas, kundli),
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 });
  }
}

function buildDoshaSummary(doshas: DoshaStatus, kundli: KundliData): string {
  const active = Object.entries(doshas).filter(([, v]) => v).map(([k]) => k);

  if (active.length === 0) {
    return `Your chart is remarkably clean! No major doshas are present. This indicates a well-balanced karma and a smoother life path. Your ${kundli.yogas[0] || 'planetary combinations'} will bring positive results.`;
  }

  const doshaNames = active.map(d => d.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ');
  return `Your chart shows ${active.length} dosha${active.length > 1 ? 's' : ''}: ${doshaNames}. These are karmic patterns that can be significantly mitigated through the prescribed remedies. With consistent effort, their negative effects can be reduced by 60–70%. The doshas also indicate specific areas of life where you will grow the most spiritually.`;
}

