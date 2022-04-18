// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

abstract contract MerkleZeros {
    uint256[33] internal zeros;

    // Quinary tree (with SHA256) zeros (Keccack hash of 'Maci')
    constructor() {
        zeros[0] = uint256(8370432830353022751713833565135785980866757267633941821328460903436894336785);
        zeros[1] = uint256(15325010760924867811060011598468731160102892305643597546418886993209427402124);
        zeros[2] = uint256(5333436556486022924864323600267292046975057763731162279859756425998760869639);
        zeros[3] = uint256(10977687713725258236554818575005054118245377800202335296681050076688083648086);
        zeros[4] = uint256(17224613048028572295675465280070534343823303585304562923867790579733480935264);
        zeros[5] = uint256(17706041913665507482150667409133417574717160680803140264120398284023956076290);
        zeros[6] = uint256(9653598640710890037650186704093119545289422499247280741743943320819000499646);
        zeros[7] = uint256(3206708589682338778875464217516564639886138074743860970529166723769308693331);
        zeros[8] = uint256(20534426109262125257001376157024458165019301442070720434223770308413031897106);
        zeros[9] = uint256(20045595674714290179477944839500625050021328745176742196691278453734645214461);
        zeros[10] = uint256(1990443879384407462884849355600260727579259402554912319388203567178699099823);
        zeros[11] = uint256(15030670756630149022405255264285307614365927334767433095054187593088567423357);
        zeros[12] = uint256(18151643848963813172699123574112664048044995742942448148573079318091374187889);
        zeros[13] = uint256(12716797128662011430654728594886216826078433472768452754660103993065334317074);
        zeros[14] = uint256(1778668013271642889777963040449750701990462149853502233417669847457236064652);
        zeros[15] = uint256(5310295518327181913512672840814534597220436900477241678956359474542866650820);
        zeros[16] = uint256(13698756698956924170299002904918188137369325655270855940405108330875686641692);
        zeros[17] = uint256(16978698509212058134355374823422776609466830925429320593002017159097039391798);
        zeros[18] = uint256(21122904167710384374017181343962526230952584354459613272526061056824616537143);
        zeros[19] = uint256(5985710021335277534018076016950505662155095700842597825798268278683684529911);
        zeros[20] = uint256(12532916265365969493430834411976825909479396013951866588908395278818546013433);
        zeros[21] = uint256(8930761113974965197874653050290197596753921117163820694764716198465769499045);
        zeros[22] = uint256(7923291528963393397483250836756011061887097780645138922028359275174896145293);
        zeros[23] = uint256(3165523255399386676797999966015195343651238663671903081942130824893771740953);
        zeros[24] = uint256(16498953853801480907823499768835003172991697981391001961022924988055514153444);
        zeros[25] = uint256(4646652977614280202033130495149148518982017582438403557846318228188699893314);
        zeros[26] = uint256(16063634456514132367413661909718374200540548246284043795891576706199387111176);
        zeros[27] = uint256(6432449679436816515158314256021560028822839412197804709124582783531979581762);
        zeros[28] = uint256(16549548229658147491856279832226477385154640474741924661165993652668688816447);
        zeros[29] = uint256(17839947633190642328550610337345984157351952156869520211179465702618934306508);
        zeros[30] = uint256(12740635476725314448365579529753493622477881762096050379151557051600454293132);
        zeros[31] = uint256(14450546044445547667240670175592035046062311068467905405735885913523641104070);
        zeros[32] = uint256(16649881337797029358598450172037019406882299786178038601098631221224645092238);
    }
}

