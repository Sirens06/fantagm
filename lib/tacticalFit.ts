import { Player, Coach } from './types';

export function tacticalFit(player: Player, coach: Coach): number {
    let score = 50;

    const prefs: string[] = player.prFormation || [];
    const formation: string = coach?.formation || '';
    const alternatives: string[] = coach?.alternativeFormations || [];

    if(prefs.includes(formation)){
        score +=35;
    } else if(alternatives.some(alt => prefs.includes(alt))){
        // Rende in un modulo che l'allenatore alterna: vale meno del titolare,
        // ma non e' il disastro di chi non ci sta in nessuno dei due.
        score += 22;
    } else if(sharesBackLine(prefs, formation)){
        score += 15
    } else {
        score -= 20;
    }

    const positionScore: number = positionModifier(player.role, formation, player.detailedPosition);

    score += positionScore;
    score -= Math.round(coach.rotationIndex * 15);

    if(player.status === 'TITOLARE'){
        score += 10;
    } else if(player.status === 'FUORI_ROSA'){
        score -= 25;
    }
    return clampScore(score, 0, 100);
}

export function clampScore (n: number, min: number, max: number): number{
    return Math.max(min, Math.min(n,max));
}

export function sharesBackLine(prefs: string[], target: string): boolean {
    const targetBackLine = target.split('-')[0];
    return prefs.some(pref => pref.split('-')[0] === targetBackLine);
}

export function positionModifier(playerRole: string, coachForm: string, playerDP: string): number {
    const detailedPosition: string = playerDP.toLowerCase();
    const withoutWings: boolean = ['3-5-2', '5-3-2', '3-5-1-1', '4-3-1-2', '3-4-1-2'].includes(coachForm);

    const wingFriendly: boolean = ['4-3-3', '4-2-3-1', '3-4-3', '3-4-2-1', '3-5-2', '5-3-2', '4-3-1-2', '3-4-1-2', '4-4-2', '4-4-1-1', '4-1-4-1', '4-2-4', '5-4-1'].includes(coachForm);

    if(withoutWings && (detailedPosition.includes('ala'))){
        return -10;
    } else if(wingFriendly && detailedPosition.includes('esterno')){
        return 15;
    } else if(coachForm === '4-2-3-1' && (detailedPosition.includes('trequartista') || detailedPosition.includes('mezzala'))){
        return 5;
    } else if(withoutWings && (detailedPosition.includes('punta') && playerRole === 'A')){
        return 10;
    } else {
        return 0;
    }
}
