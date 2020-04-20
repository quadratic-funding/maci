// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// 2019 OKIMS

pragma solidity ^0.5.0;

library Pairing {

    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /*
     * @return The negation of p, i.e. p.plus(p.negate()) should be zero. 
     */
    function negate(G1Point memory p) internal pure returns (G1Point memory) {

        // The prime q in the base field F_q for G1
        if (p.X == 0 && p.Y == 0) {
            return G1Point(0, 0);
        } else {
            return G1Point(p.X, PRIME_Q - (p.Y % PRIME_Q));
        }
    }

    /*
     * @return The sum of two points of G1
     */
    function plus(
        G1Point memory p1,
        G1Point memory p2
    ) internal view returns (G1Point memory r) {

        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas, 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-add-failed");
    }

    /*
     * @return The product of a point on G1 and a scalar, i.e.
     *         p == p.scalar_mul(1) and p.plus(p) == p.scalar_mul(2) for all
     *         points p.
     */
    function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {

        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas, 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }

    /* @return The result of computing the pairing check
     *         e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
     *         For example,
     *         pairing([P1(), P1().negate()], [P2(), P2()]) should return true.
     */
    function pairing(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {

        G1Point[4] memory p1 = [a1, b1, c1, d1];
        G2Point[4] memory p2 = [a2, b2, c2, d2];

        uint256 inputSize = 24;
        uint256[] memory input = new uint256[](inputSize);

        for (uint256 i = 0; i < 4; i++) {
            uint256 j = i * 6;
            input[j + 0] = p1[i].X;
            input[j + 1] = p1[i].Y;
            input[j + 2] = p2[i].X[0];
            input[j + 3] = p2[i].X[1];
            input[j + 4] = p2[i].Y[0];
            input[j + 5] = p2[i].Y[1];
        }

        uint256[1] memory out;
        bool success;

        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas, 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }

        require(success,"pairing-opcode-failed");

        return out[0] != 0;
    }
}

contract BatchUpdateStateTreeVerifier {

    using Pairing for *;

    uint256 constant SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[21] IC;
    }

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(uint256(10570564766920920676315022674415630616723471828118158897280844890394944495787), uint256(3599185544175546016022283478736164243827136512988542969558631480606989624768));
        vk.beta2 = Pairing.G2Point([uint256(21790046037816490002642061367105962727267604584677567207959050823121202633128), uint256(15989946137531866898626939994605940790207468713928547177019663380034717477470)], [uint256(16853140088229721825546709471376665926178505429167028867844921559392992792161), uint256(6336017586289075059512582173433139692903030685476233835171199260100930980647)]);
        vk.gamma2 = Pairing.G2Point([uint256(18933899922594894629817072475676210935994297029422179372637448632738736891487), uint256(13898164752537379189105985316467154114993045484664106897565194536796329062481)], [uint256(19950680881551210052470916704101928768499140701455955339179334851161628500423), uint256(19721474559638911315431128476872612337899748379529101816393573870718152632870)]);
        vk.delta2 = Pairing.G2Point([uint256(11577771129514676757888997983097961842406566091278081474873519256805197877451), uint256(12310680259156367160482244633996979901218615503366526966482070133714878236672)], [uint256(3258979601287837628398710812960635623639391762738641830119320422332388786107), uint256(15732554501345074036475330287374569465739232643737771524280271351040169387534)]);
        vk.IC[0] = Pairing.G1Point(uint256(2686086268935256115680119806047046831299559111217204238096009864747777756420), uint256(7567806866805065402928587547108117574843694021092862578703930929162600713830));
        vk.IC[1] = Pairing.G1Point(uint256(1627796953209125191194508302672009264809449614668053296135773948028019539305), uint256(15016718784299796782315469523162190607396416691213009322047233004135561961481));
        vk.IC[2] = Pairing.G1Point(uint256(14257777411531457570445019107039771918954330075621956629041059740013410700518), uint256(9251627903130779701522373603306037657959395037742112189376410822072376008629));
        vk.IC[3] = Pairing.G1Point(uint256(6164172918179375491990943649241988810495330250933720345356217464495940998662), uint256(15005008146796524789062255253971398049963232703993468529458332383926033043451));
        vk.IC[4] = Pairing.G1Point(uint256(13196983940714701995638243068100537707866953632416902091429124197947407990396), uint256(1925594065250855965979618871537058740773916713281286526963329202841952221518));
        vk.IC[5] = Pairing.G1Point(uint256(14745414406522860197520353417024572285014996024513289512200646700788839601347), uint256(7889710162722268764332612676074323082003386014835427565222697819885026956538));
        vk.IC[6] = Pairing.G1Point(uint256(12671578729810640340190866761514548886904332065601600510867977486609224403305), uint256(8377023414315842985890583061962162784806113507142615534148073127612016188592));
        vk.IC[7] = Pairing.G1Point(uint256(5118428716227161793777137580335555453521689323860147407572961068228851942168), uint256(993916306204443905811701559144770575881480669329514416555074114595269156490));
        vk.IC[8] = Pairing.G1Point(uint256(14398717028128114848135427142652658514024224686787618912109529716482636474570), uint256(2135927773981535388493951071180316221509538206423327965686729041845838864221));
        vk.IC[9] = Pairing.G1Point(uint256(16645267136578452759696049227818348245605443672480125704348526835807544314885), uint256(8114211329425747314628472933697640758213675188795866045888585963298816576433));
        vk.IC[10] = Pairing.G1Point(uint256(4203713908947598251858895536852457162496526534464091254529896697638465272186), uint256(9456491021457514781205817500987417397131491074808039276872194587224127064259));
        vk.IC[11] = Pairing.G1Point(uint256(6642886947030599316461532667025687064667476774897829981230348669655711175131), uint256(5676312125110826933087322816749969639596305999562911020256497866670638889870));
        vk.IC[12] = Pairing.G1Point(uint256(17459108451926708114025688272036218517410688165239844499779658205361665201306), uint256(18732183378892137728164754760758627088837601345421740096204823670080564344108));
        vk.IC[13] = Pairing.G1Point(uint256(18515733603569737745626459742328183064378751546892486232380857451313331120661), uint256(4712828783197853190308080225938696964997596821609263202187330640402085753122));
        vk.IC[14] = Pairing.G1Point(uint256(17899391815756324919838123575981347830054885956341016690639442072258689845868), uint256(13403088741013738709603015094682716034310013877299716994501841820646385583206));
        vk.IC[15] = Pairing.G1Point(uint256(16323941776946526424702399497015282418019182938143909755309205350463533453998), uint256(16970194893669744830827288625745812240636518254614067089054763371734208129523));
        vk.IC[16] = Pairing.G1Point(uint256(8133432909160283416361524761656508006606717280519320681825479570197639219037), uint256(13617144351143017219757343104874099572034622830472758323587529726320694804635));
        vk.IC[17] = Pairing.G1Point(uint256(2239505059962388624782157548141367419614190705433513352570705631127340498237), uint256(8120755015061083226170405380725887194742628643229235845884130180790916124725));
        vk.IC[18] = Pairing.G1Point(uint256(2504161322838044218444684645645186557935416901322539094615549157077375686081), uint256(9921615491762086917254135278205589289673000015739192274460900153416988157267));
        vk.IC[19] = Pairing.G1Point(uint256(5550392005423909466505206473121706374962556687167579461652497385713658384418), uint256(7532055981392212862697025930150618693377968466715806875866502475223965271408));
        vk.IC[20] = Pairing.G1Point(uint256(15882261399787566273605724501003666412013858926449594325166780645318621080268), uint256(11350174551378080158859554844263332426902194601497959194672631739034731839509));

    }
    
    /*
     * @returns Whether the proof is valid given the hardcoded verifying key
     *          above and the public inputs
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[20] memory input
    ) public view returns (bool) {

        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);

        VerifyingKey memory vk = verifyingKey();

        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);

        // Make sure that proof.A, B, and C are each less than the prime q
        require(proof.A.X < PRIME_Q, "verifier-aX-gte-prime-q");
        require(proof.A.Y < PRIME_Q, "verifier-aY-gte-prime-q");

        require(proof.B.X[0] < PRIME_Q, "verifier-bX0-gte-prime-q");
        require(proof.B.Y[0] < PRIME_Q, "verifier-bY0-gte-prime-q");

        require(proof.B.X[1] < PRIME_Q, "verifier-bX1-gte-prime-q");
        require(proof.B.Y[1] < PRIME_Q, "verifier-bY1-gte-prime-q");

        require(proof.C.X < PRIME_Q, "verifier-cX-gte-prime-q");
        require(proof.C.Y < PRIME_Q, "verifier-cY-gte-prime-q");

        // Make sure that every input is less than the snark scalar field
        for (uint256 i = 0; i < input.length; i++) {
            require(input[i] < SNARK_SCALAR_FIELD,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }

        vk_x = Pairing.plus(vk_x, vk.IC[0]);

        return Pairing.pairing(
            Pairing.negate(proof.A),
            proof.B,
            vk.alfa1,
            vk.beta2,
            vk_x,
            vk.gamma2,
            proof.C,
            vk.delta2
        );
    }
}
