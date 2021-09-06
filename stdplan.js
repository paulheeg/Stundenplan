<script type="text/javascript">

'use strict'


/*++++++++++++++
+ Stundenplan als One-page = mit wenig zwischenladen
++++++++++++++*/

// globale Variablen
// zum Wiederherstellen von Einträgen
// ** gut wäre ein Objekt Global mit set und get

// Die globalen Variablen
// Initialisieren beim Start 
let Standard={};  
let Wo_ist=[];
let Wo_ist_cache=[];
let U_zeit=[];
let Dozent=[];
let Stundenplan_tabelle='';
let Raeume=[];
let Alle_lf=[];

function initialisieren(was,json){
    // {typ: ,inhalt: jahreswoche: soll : array, alle : array 
    if('Standard'===was) Standard=_parse(was,json);
    // ***
    else if('Stundenplan_tabelle'=== was) Stundenplan_tabelle=json; // ** Namen offen gefällt mir nicht besser als Teil von Standard planung ja/nein 
    else if('Wo_ist'===was) Wo_ist=_parse(was,json);
    
// ['id'=>$e['id'], 'klasse'=>$e['klasse'], 'klasse_id'=>$e['klasse_id'],  'lernfeld'=>$e['lernfeld'], 'lernfeld_id'=>$e['lernfeld_id'], 'schwerpunkt'=>$e['schwerpunkt'], 'schwerpunkt_id'=>$e['schwerpunkt_id'], 'dozent_id'=>$e['dozent_id'], 'dozent'=>$e['dozent'], 'von'=> $e['von'], 'bis'=>$e['bis'], 'hinweis'=>$e['hinweis'], 'unterrichtsform'=>$e['unterrichtsform'], 'raum'=>$e['raum'] ];
    else if('U_zeit'===was) U_zeit=_parse(was,json);
    else if('U_zeit'===was) U_zeit=_parse(was,json);
    // {"id":1, 'name': 'Paul Heeg'}
    else if('Dozent'===was) Dozent=_parse(was,json);
    else if('Raeume'===was) Raeume=_parse(was,json);
    else if('Alle_lf'===was) Alle_lf=_parse(was,json);
    else alert("Programmfehler initialisieren "+was);
    
    function _parse(was,json){
        try {return(JSON.parse(json));}
        catch(e) {
            alert(`Fehler beim initialisieren: ${was} ${e}`);
            return([]);
        }
    }
}

// Globale Variablen zur Kommunikation zwischen Teilen des Programms
const U_alt={'bereich':'','id':0,'neu_id':0}; // wird benutzt für wiederherstellen
const Kopier_modus={'planung': 0, 'jahreswoche':'', 'aktiv' : 0, 'alle' : [], 'tage' : []};

// Schreibabkürzungen
const TAG=86400000;
const wochentage=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'];

// start kopieren
// ** bitte wonaders hin tun

function kopier_fenster_loeschen(bereich){
    Kopier_modus.aktiv=0;
    document.getElementById(bereich).innerHTML='';
    const b1=document.getElementById('zweifenster_button');
    const onclick=`kopier_fenster('zweitesfenster','${Standard.typ}','${Standard.inhalt}','${woche_vor_zurueck(Standard.jahreswoche).zurueck}',0)`;
    b1.innerText="Kopierfenster";
    b1.setAttribute('onclick',onclick);
}


function kopier_fenster(bereich,typ,was,jahreswoche,planung){
    if(planung) Kopier_modus.planung=1;
    else Kopier_modus.planung=0;
    Kopier_modus.jahreswoche=jahreswoche;
    Kopier_modus.aktiv=1;
    
    const b1=document.getElementById('zweifenster_button');
    b1.innerText="nur ein Fenster";
    b1.setAttribute('onclick',"kopier_fenster_loeschen('zweitesfenster')");
 
    const b=document.getElementById(bereich); // zweitesfenster
    b.innerHTML='';
    
    // kopf des Kopierfensters
    const vor_zurueck=woche_vor_zurueck(jahreswoche);
    const ueberschrift=document.createElement('h3');
    
    const a_zurueck=document.createElement('a');
    a_zurueck.href=`javascript:kopier_fenster('${bereich}','${typ}','${was}','${vor_zurueck.zurueck}',${Kopier_modus.planung})`;
    a_zurueck.innerHTML='&lt;&lt;';
    ueberschrift.appendChild(a_zurueck);
    
    const wtage=['Mo','Di','Mi','Do','Fr'];
    
    const str='klasse'===Standard.typ ? Standard.inhalt : 
        'tag'==Standard.typ ? wtage[Standard.inhalt] : Dozent.find(x => x.id===Standard.inhalt).name;
    ueberschrift.appendChild(document.createTextNode(` Kopiere ${str} von Woche ${jahreswoche} `));


    if(Kopier_modus.planung) ueberschrift.appendChild(document.createTextNode('in Planung '));
                                                                                
    const a_vor=document.createElement('a');
    a_vor.href=`javascript:kopier_fenster('${bereich}','${typ}','${was}','${vor_zurueck.vor}',${Kopier_modus.planung})`;
    a_vor.innerHTML='&gt;&gt;';
    ueberschrift.appendChild(a_vor);
    b.appendChild(ueberschrift);

    const button_planung=document.createElement('button');
    button_planung.id='planung';
    if(Kopier_modus.planung) button_planung.innerText="Stundenplan für Schüler*innen";
    else button_planung.innerText="Stundenplan Planung";
    const onclick=`javascript:kopier_fenster('${bereich}','${typ}','${was}','${jahreswoche}',${Kopier_modus.planung? 0 : 1})`;
    button_planung.setAttribute('onclick',onclick);
    b.appendChild(button_planung);

    const button_alles_kopieren=document.createElement('button');
    button_alles_kopieren.innerText='alles kopieren';
    button_alles_kopieren.setAttribute('onclick','kopier_eintragen_alle()');
    
    b.appendChild(button_alles_kopieren);
    
    // tabelle des Kopierfensters
    const tabelle=document.createElement('table');
    tabelle.style.border="2px solid black";
    tabelle.id="tabelle_zwei";
    const klassen_liste=Standard.klassen.map(e=>e.inhalt); // die Klassen des Hauptfensters

    // siehe Wochennavigation
    const l = jahreswoche.split('_');
    const vierter= new Date(l[0],0,4);
    const woche_nr=parseInt(l[1]);
    const ersterDonnerstag= new Date(vierter.getTime() + (3- ((vierter.getDay()+6) % 7 )) * TAG);
    const tag=new Date(ersterDonnerstag.getTime()+TAG*7*(woche_nr -1)-TAG*3);

    
    // Kopfzeile der Tabelle
    if('tag'==typ){
        const tr=document.createElement('tr');
        for(const klasse of klassen_liste){ 
            const th=document.createElement('th');
            th.style.border="1px solid brown";
            th.appendChild(document.createTextNode(klasse));
            tr.appendChild(th);
        }
        tabelle.appendChild(tr);
    }
    else {
        const tr=document.createElement('tr');
        wtage.forEach((e,i)=> {
            const th=document.createElement('th');
            th.style.border="1px solid green";
            const tag_str=`${wtage[i]} ${tag.getDate()}.${tag.getMonth()+1}.${tag.getFullYear()}`;
            tag.setDate(tag.getDate()+1);
            th.appendChild(document.createTextNode(tag_str));
            tr.appendChild(th);
            // tr.appendChild(document.createElement('th').appendChild(document.createTextNode(`${wtage[i]} ${tag_str}`)));
        });
        tabelle.appendChild(tr);
    }
    
    // 6 X N leere Felder
    const spalten='tag'==Standard.typ?klassen_liste.length:wochentage.length;
    const zeilen=5;
    // zeile null für Tagesinfos und Termin
    const tr=document.createElement('tr');
    // zeile 1 bis zeilen für die Zeiten
    tabelle.appendChild(tr);
    for(let i=1;i<=zeilen;i++) {
        const tr=document.createElement('tr');
        for(let j=0;j<spalten;j++){
            const td=document.createElement('td');
            td.style.border="1px solid gray";
            td.id=`zwei_${i}_${j}`;
            tr.appendChild(td);
        }
        tabelle.appendChild(tr);
    };
    b.appendChild(tabelle);
    
    if('dozent_id'==Standard.typ) U_zeit.filter(e=>e.dozent_id==Standard.inhalt).forEach(x => markiere(x,klassen_liste));
    else if('klasse'==Standard.typ) U_zeit.filter(e=>e.klasse==Standard.inhalt).forEach(x => markiere(x,klassen_liste));
    else if('raum'==Standard.typ) U_zeit.filter(e=>e.raum==Standard.inhalt).forEach(x => markiere(x,klassen_liste));
    else { // if('tag'==Standard.typ);
        const v= parseInt(Standard.inhalt); // im blocktag die letzte Ziffer gedreht auf getDay()
        const tag_nr= (6==v) ? 0 : v + 1;
        U_zeit.filter(x=>parseInt(new Date(x.von*1000).getDay())==tag_nr).forEach(y=> markiere(y,klassen_liste));
    }
    
    // den Unterricht dieser Woche markieren = von hier kann man nicht kopieren
    function markiere(u,klassen_liste){
        const zeile=zeile_nr(u.von);
        const spalte='tag'===typ ? klassen_liste.indexOf(u.klasse) : _wochentag_nr(u.von);
        // klassen_liste.indexOf(u.klasse);
        const b=document.getElementById(`zwei_${zeile}_${spalte}`);
        b.style.backgroundColor='#bbbbbb';
            
    }
    
	const aufruf=`stdplan_editieren_eintragen.php?typ=kopier_fenster&kopiertyp=${typ}&inhalt=${was}&jahreswoche=${jahreswoche}&planung=${planung}`;

    const alle=[];
    
    const req = getXMLHttpRequest();
	if(! req) {alert("kann kein HttpRequest aufbauen"); return;}
	
	req.onreadystatechange = function(){
		if(req.readyState == 4) {
			const ergebnis= req.responseText;
			if('[' != ergebnis.substr(0,1) ) {alert('Fehler (kopier_fenster): '+ergebnis); return;}
			const u_kopieren= JSON.parse(ergebnis);
            
            
            _unterricht_eintragen(bereich,Standard.typ,Standard.inhalt,u_kopieren);
            Kopier_modus.alle=u_kopieren;
        }
    }
    
	req.open("GET",aufruf);
	req.send(null);
    

    
    function _unterricht_eintragen(bereich,typ,inhalt,u_zeiten){
        // const b = document.getElementById(bereich);
    //     const klassen_liste=Standard.klassen.map(e=>e.inhalt);
        
        if('dozent_id'===typ) u_zeiten.filter(e=>e.dozent_id==inhalt).forEach(e => _u2bereich(typ,[],e));
        else if('klasse'==typ) u_zeiten.filter(e=>e.klasse==inhalt).forEach(e => _u2bereich(typ,klassen_liste,e));
        else { // if('tag'==typ);
            const v= parseInt(inhalt); 
            const tag_nr= (6==v) ? 0 : v + 1;
            u_zeiten.filter(x=>parseInt(new Date(x.von*1000).getDay())==tag_nr).forEach(y=>_u2bereich(typ,klassen_liste,y));
        }
    
        // trägt ein U_zeit Element ein Dozent und Klasse
        function _u2bereich(typ,klassen_liste,u){
            // const b = document.getElementById(bereich);
            const zeile=zeile_nr(u.von);
            const spalte='tag'===typ ? klassen_liste.indexOf(u.klasse) : _wochentag_nr(u.von);
            // klassen_liste.indexOf(u.klasse);
            const b=document.getElementById(`zwei_${zeile}_${spalte}`);
            
            const div=document.createElement('div');
            // div.id=`u2_${u.id}`;
            // alert(JSON.stringify(u));
            const u_von= new Date(u.von*1000).toTimeString().substring(0,5);
            const u_bis= new Date(u.bis*1000).toTimeString().substring(0,5);
            div.appendChild(document.createTextNode(`${u_von} - ${u_bis} `));
            
            div.appendChild(document.createElement('br'));
            const fett=document.createElement('b');
            if(''===b.style.backgroundColor) {
                  const a=document.createElement('a');
                a.href=`javascript:kopier_eintragen_element('${JSON.stringify(u)}')`;
                if('dozent_id'===typ) a.innerText=u.klasse;
                else a.innerText=u.dozent;
                fett.appendChild(a);
                alle.push(u.id);
            } else {
                if('dozent_id'===typ) fett.appendChild(document.createTextNode(u.klasse));
                else fett.appendChild(document.createTextNode(u.dozent));
                
            }
            
            div.appendChild(fett);
            div.appendChild(document.createElement('br'));
            div.appendChild(document.createTextNode(`${u.lernfeld} ${u.schwerpunkt}`));
            if(u.raum){
                div.appendChild(document.createElement('br'));
                div.appendChild(document.createTextNode(`Raum: ${u.raum}`));
            }
            if(u.hinweis) {
                div.appendChild(document.createElement('br'));
                div.appendChild(document.createTextNode(u.hinweis));
            }
                
            //{"id":"73735","klasse":"Spa_22","klasse_id":"27","lernfeld":"LF3","lernfeld_id":"28","schwerpunkt":"","schwerpunkt_id":"0","dozent_id":"1","dozent":"Heeg, Paul","von":"1630321200","bis":"1630326600","hinweis":"","unterrichtsform":""}
            b.appendChild(div);
            b.appendChild(document.createElement('br'));
        }

     /*
        function _u2bereich_tag(u){
            const zeile=zeile_nr(u.von);                
            const spalte=klassen_liste.indexOf(u.klasse);
            const b=document.getElementById(`zwei_${zeile}_${spalte}`);
            const div=document.createElement('div');
            div.id=`u2_${u.id}`;
            b.appendChild(div);
        // ausgabe_html(div.id,u.id,u);
        }
        */
        
    }
}

function kopier_eintragen(liste){
    const id_liste=liste.map(x=>x.id);
    const aufruf=`stdplan_editieren_eintragen.php?typ=kopier_eintragen&planung=${Standard.planung}&von_planung=${Kopier_modus.planung}&jahreswoche=${Standard.jahreswoche}&inhalt=${JSON.stringify(id_liste)}`;
    
    alert(aufruf);
    
    const req = getXMLHttpRequest();
	if(! req) {alert("kann kein HttpRequest aufbauen"); return;}
	
	req.onreadystatechange = function(){
		if(req.readyState == 4) {
			const ergebnis= req.responseText;
			if('{' != ergebnis.substr(0,1) ) {alert('Fehler (kopier_eintragen): '+ergebnis); return;}
			const e= JSON.parse(ergebnis);
			if('diagnostik'==e.ergebnis) alert("Diagnostik (kopier_eintragen):" + ergebnis);
			else if('ok'!=e.ergebnis) {
				alert("nicht erfolgreich: "+e.ergebnis+"\n"+ergebnis); 
				return;
            }
            for(let i=0;i<liste.length;i++) {
                let u=liste[i];
                let u_neu=e.unterricht[i];
                u.von=u_neu.von;
                u.bis=u_neu.bis;
                u.jahreswoche=u_neu.jahreswoche;
                U_zeit.push(u);
                u_bereich(u);
            }
            info_bereich();
		}
    }
	req.open("GET",aufruf);
	req.send(null);	
}


function kopier_eintragen_alle(){
    kopier_eintragen(Kopier_modus.alle);
}
function kopier_eintragen_element(u_json){
    const u=JSON.parse(u_json);
    kopier_eintragen([u]);
}


// ende Abschnitt kopieren

// ** das muss eine getrennte Funktion sein und nicht in ausgabe()! 
// ** Grund: Die Seite in dem Zustand laden, in dem sich das System zum Zeitpunkt des clicks befindet und nicht beim Aufruf von ausgabe()
function neu_laden(){
    // alert(`stundenplan_editieren.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&jahreswoche=${Standard.jahreswoche}&planung=${Stundenplan_tabelle==='stundenplan_in_planung' ? 1 : 0}`);
    window.location=`stundenplan_editieren.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&jahreswoche=${Standard.jahreswoche}&planung=${Stundenplan_tabelle==='stundenplan_in_planung' ? 1 : 0}`;
}

// startet die im Daten eingegebene Kalenderwoche
function datum_eingeben(bereich){
    const b=document.getElementById(bereich);
    const inhalt=b.value;
    
    // ** leerer Inhalt = aktuelle Woche
    const datum = new Date();
    
    
    if(''!=inhalt) {
        const l=inhalt.split('.');
        if(3!=l.length)  {alert(`Bitte Datum eingeben: 3.5.2021 nicht ${inhalt}`); return(-2);}
    
        const tag = parseInt(l[0]);
        const monat = parseInt(l[1]);
        let jahr = parseInt(l[2]);
    
        if(tag<1 || tag>31) {alert(`Tag nicht korrekt: ${tag} ist kein Tag`); return(-2);}
        if(monat<1 || monat>12) {alert(`Monat nicht korrekt: ${monat} ist kein Monat`); return(-2);}
        if(31==tag && (2==monat || 4==monat || 6==monat || 9==monat || 11==monat) ) {alert(`${monat} hat keine 31 Tage`); return(-2);}
        if(30==tag && 2==monat) {alert(`Tag nicht korrekt: Februar hat keine 30 Tage`); return(-2);}
        if(29==tag && 2==monat && jahr% 4) {alert(`Tag nicht korrekt: Februar kein Schaltjahr`); return(-2);}
    
        if(! jahr) jahr=new Date().getYear;
        else if(jahr<100) jahr=jahr+2000;
    
        datum.setYear(jahr);
        datum.setMonth(monat-1);
        datum.setDate(tag);
    }
    
    // const jahr= datum.getFullYear();
    
    const dieserDonnerstag=new Date(datum.getTime()+ (3-((datum.getDay()+6) %7 )) * 86400000);
    const jahr=dieserDonnerstag.getFullYear();
    const vierter= new Date(jahr,0,4);
    const ersterDonnerstag= new Date(vierter.getTime() + (3- ((vierter.getDay()+6) % 7 )) * 86400000);
    
    const woche_nr=Math.floor(1+0.5 + (dieserDonnerstag.getTime()  - ersterDonnerstag.getTime()) / (86400000 * 7));
    
    const jahreswoche=`${jahr}_${woche_nr}`;
    
    window.location=`stundenplan_editieren.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&jahreswoche=${jahreswoche}&planung=${Standard.planung}`;
}

// Rückgabe: {vor: str, zurueck: str}
function woche_vor_zurueck(jahreswoche){
    const l = jahreswoche.split('_');
    const ergebnis={'vor':'','zurueck':''};
    const woche = parseInt(l[1]);
    const jahr=parseInt(l[0]);
    if(woche>1) ergebnis.zurueck=`${jahr}_${woche-1}`;
    else ergebnis.zurueck=`${jahr-1}_53`; // ** nicht korrekt aber reicht mir 
    if(woche<53) ergebnis.vor= `${jahr}_${woche+1}`;
    else ergebnis.vor=`${jahr+1}_1`;
    return(ergebnis);
}

function wochen_navigation(kalenderwoche){
    const l = kalenderwoche.split('_');
    const vierter= new Date(l[0],0,4);
    const woche_nr=parseInt(l[1]);
    const ersterDonnerstag= new Date(vierter.getTime() + (3- ((vierter.getDay()+6) % 7 )) * TAG);
    const montag=new Date(ersterDonnerstag.getTime()+TAG*7*(woche_nr -1)-TAG*3);
    const freitag=new Date(ersterDonnerstag.getTime()+TAG*7*(woche_nr -1)+TAG);
    const str1=Standard.planung ? ' in Planung ' : '';
    const str=` Stundenplan editieren ${str1} ${montag.getDate()}.${montag.getMonth()+1} - ${freitag.getDate()}.${freitag.getMonth()+1}.${montag.getFullYear()} (${l[1]}. Woche) `;
    const ueberschrift=document.createElement('h1');

    const vor_zurueck=woche_vor_zurueck(kalenderwoche);
    const link_zurueck=document.createElement('a');
    const planung= 'stundenplan_in_planung'==Stundenplan_tabelle ? 1 : 0;
    
    link_zurueck.href=`stundenplan_editieren.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&jahreswoche=${vor_zurueck.zurueck}&planung=${planung}`;
    
    link_zurueck.innerHTML='&lt;&lt;';
    ueberschrift.appendChild(link_zurueck);

    ueberschrift.appendChild(document.createTextNode(str));
    
    const link_vor=document.createElement('a');
    link_vor.href=`stundenplan_editieren.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&jahreswoche=${vor_zurueck.vor}&planung=${planung}`;
    
    link_vor.innerHTML='&gt;&gt;';
    ueberschrift.appendChild(link_vor);
    
    return(ueberschrift);
    
}

// zu dem normalen Stundenplan
function zu_ohne_editieren(){
    document.location.href=`stdplan.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&planung=${Standard.planung}&jahreswoche=${Standard.jahreswoche}`; 
}

// die globale Steuerung oberste Ebene
    
// Ausgabe aller Einträge in divs
function ausgabe(bereich){
    const b=document.getElementById(bereich);
    b.innerHTML='';
    
    const ohne_editieren=document.createElement('div');
    ohne_editieren.style.float='right';
    
    const ohne_button=document.createElement('button');
    ohne_button.onclick=function() {zu_ohne_editieren()};
    ohne_button.appendChild(document.createTextNode('ohne editieren'));
    ohne_editieren.appendChild(ohne_button);
    b.appendChild(ohne_editieren);
    // printf("<div style=\"float: right\">ohne Editieren</div>");

    
    b.appendChild(wochen_navigation(Standard.jahreswoche));
    
        // link zu zweitem Fenster
    const neu_laden=document.createElement('button');
    neu_laden.setAttribute('onclick','neu_laden()');
    neu_laden.innerHTML="<b>&#8635;</b>";
    b.appendChild(neu_laden);
 
    const zweifenster=document.createElement('button');
    zweifenster.id='zweifenster_button'
    
    if(Kopier_modus.aktiv){
        zweifenster.innerText="nur ein Fenster";
        const onclick="kopier_fenster_loeschen('zweitesfenster')";
        zweifenster.setAttribute('onclick',onclick);
    }
    else {
        const onclick=`kopier_fenster('zweitesfenster','${Standard.typ}','${Standard.inhalt}','${woche_vor_zurueck(Standard.jahreswoche).zurueck}',0)`;
        zweifenster.innerText="Zweites Fenster";
        zweifenster.setAttribute('onclick',onclick);
    }
    b.appendChild(zweifenster);
    
    if(Kopier_modus.aktiv) 
        kopier_fenster('zweitesfenster',Standard.typ,Standard.inhalt,Kopier_modus.jahreswoche,Kopier_modus.planung);
    
    const zeit_eingabe=document.createElement('input');
    zeit_eingabe.setAttribute('size','5pt');
    zeit_eingabe.id='zeit_eingabe';
    zeit_eingabe.value='?';
    zeit_eingabe.setAttribute('onchange',`datum_eingeben('${zeit_eingabe.id}')`);
    b.appendChild(document.createTextNode(" Datum eingeben: "));
    b.appendChild(zeit_eingabe);
   
    const kopf=document.createElement('div');
    kopf.id='kopfbereich';
    b.appendChild(kopf);
    
    const platz_fuer_zweites_fenster=document.createElement('div');
    platz_fuer_zweites_fenster.id='zweitesfenster';
    platz_fuer_zweites_fenster.style.backgroundColor='orange';
    b.appendChild(platz_fuer_zweites_fenster);

    const tabelle=document.createElement('div');
    tabelle.id='tabellenbereich';
    tabelle.style.float='left';
    tabelle.style.marginBottom=10;
    b.appendChild(tabelle);
    
    const info=document.createElement('div');
    info.id='infobereich';
    info.style.float='left';
    info.style.margin="0 0 0 20pt";
    b.appendChild(info);
    
    const zeiten=document.createElement('div');
    zeiten.id='zeitenbereich';
    zeiten.style.clear='both';
    b.appendChild(zeiten);

    // alles starten
    
    starten_kopf(kopf.id);
    starten_zeiten(zeiten.id); // **hier wird Wo_ist_cache erzeugt
    starten_tabelle(tabelle.id);
    info_bereich();
    
    
    function wochen_navigation(kalenderwoche){
        const l = kalenderwoche.split('_');
        const vierter= new Date(l[0],0,4);
        const woche_nr=parseInt(l[1]);
        const ersterDonnerstag= new Date(vierter.getTime() + (3- ((vierter.getDay()+6) % 7 )) * TAG);
        const montag=new Date(ersterDonnerstag.getTime()+TAG*7*(woche_nr -1)-TAG*3);
        const freitag=new Date(ersterDonnerstag.getTime()+TAG*7*(woche_nr -1)+TAG);
        const str1=Standard.planung ? ' in Planung ' : '';
        const str=` Stundenplan editieren ${str1} ${montag.getDate()}.${montag.getMonth()+1} - ${freitag.getDate()}.${freitag.getMonth()+1}.${montag.getFullYear()} (${l[1]}. Woche) `;
        const ueberschrift=document.createElement('h1');

        const vor_zurueck=woche_vor_zurueck(kalenderwoche);
        const link_zurueck=document.createElement('a');
        const planung= 'stundenplan_in_planung'==Stundenplan_tabelle ? 1 : 0;
    
        link_zurueck.href=`stundenplan_editieren.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&jahreswoche=${vor_zurueck.zurueck}&planung=${planung}`;
    
        link_zurueck.innerHTML='&lt;&lt;';
        ueberschrift.appendChild(link_zurueck);

        ueberschrift.appendChild(document.createTextNode(str));
    
        const link_vor=document.createElement('a');
        link_vor.href=`stundenplan_editieren.php?typ=${Standard.typ}&inhalt=${Standard.inhalt}&jahreswoche=${vor_zurueck.vor}&planung=${planung}`;
    
        link_vor.innerHTML='&gt;&gt;';
        ueberschrift.appendChild(link_vor);
    
        return(ueberschrift);
    
    }

}
    

// Steuerung oberste Ebene
function aktiviere_ausgabe(bereich,typ,inhalt){
    Standard.typ=typ;
    Standard.inhalt=inhalt;
    ausgabe(bereich);
}

// Aufbau der Tabelle
function starten_kopf(bereich){
    const b=document.getElementById(bereich);
    
    const eltern_bereich=b.parentNode.id;
    // const b1=document.getElementById('infobereich');
    // ** und so weiter ...
    
    // klassen
    const klein=document.createElement('p');
    klein.style.fontSize='smaller';
    for(const klasse of Standard.klassen.map(e=>e.inhalt)){
        if('klasse'==Standard.typ && klasse==Standard.inhalt){ 
            klein.appendChild(document.createTextNode(`${klasse} `));
        }
        else {
            const a=document.createElement('a');
            a.href=`javascript:aktiviere_ausgabe('${eltern_bereich}','klasse','${klasse}')`;
            a.appendChild(document.createTextNode(klasse));
            klein.appendChild(a);
            klein.appendChild(document.createTextNode('\xa0 '));
        }
    }
    klein.appendChild(document.createElement('br'));
    klein.appendChild(document.createElement('br'));
    
    // dozenten
    // sämtliche Lehrer*innen
    for(const lehrer of Dozent.filter(e=>e.id>0)){
        
        if('dozent_id'==Standard.typ && lehrer.id==Standard.inhalt){ 
            klein.appendChild(document.createTextNode(`${lehrer.name} `));
        }
        else {
            const a=document.createElement('a');
            a.href=`javascript:aktiviere_ausgabe('${eltern_bereich}','dozent_id','${lehrer.id}')`;
            a.appendChild(document.createTextNode(lehrer.name));
            klein.appendChild(a);
            klein.appendChild(document.createTextNode('\xa0 '));
        }
    }
    // Dozentinnen nur mit Unterricht ist alphabetisch sortieren
    const doz_l=U_zeit.filter(e=>e.dozent_id<0).sort((e1,e2)=>e1.dozent<e2.dozent?-1:e1.dozent>e2.dozent?1:0);
    let i=0;
    for(const dozent of doz_l){
        if(dozent.dozent_id==i) continue; // Doubletten entfernen
        i=dozent.dozent_id;
        if('dozent_id'==Standard.typ && dozent.dozent_id==Standard.inhalt){ 
            klein.appendChild(document.createTextNode(`${dozent.dozent} `));
        }
        else{
            const a=document.createElement('a');
            a.href=`javascript:aktiviere_ausgabe('${eltern_bereich}','dozent_id','${dozent.dozent_id}')`;
            a.appendChild(document.createTextNode(dozent.dozent));
            klein.appendChild(a);
        }
        klein.appendChild(document.createTextNode('\xa0 '));
    }
    
    klein.appendChild(document.createElement('br'));
    klein.appendChild(document.createElement('br'));
        
    // Wochentage
    // const wochentage=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag'];
    wochentage.forEach((tag,i) => {
        if('tag'==Standard.typ && i==Standard.inhalt){
            klein.appendChild(document.createTextNode(`${tag}\xa0 `));
        }
        else {
            const a=document.createElement('a');
            a.href=`javascript:aktiviere_ausgabe('${eltern_bereich}','tag','${i}')`;
            a.appendChild(document.createTextNode(tag));
            klein.appendChild(a);
            klein.appendChild(document.createTextNode('\xa0 '));
        }
    });
    
    // Räume
    klein.appendChild(document.createElement('br'));
    klein.appendChild(document.createElement('br'));
    Raeume.forEach(x => {
        if(''===x);
        else if('raum'==Standard.typ && x==Standard.inhalt) klein.appendChild(document.createTextNode(`${x}\xa0 `) );
        else {
            const a=document.createElement('a');
            a.href=`javascript:aktiviere_ausgabe('${eltern_bereich}','raum','${x}')`;
            a.appendChild(document.createTextNode(x));
            klein.appendChild(a);
            klein.appendChild(document.createTextNode('\xa0 '));
        }
    });
    
    b.appendChild(klein);
    
    // Überschrift
    const ueberschrift=document.createElement('h2');
    const tag=new Date(Standard.montag*1000);

    if('dozent_id'==Standard.typ) {
        const name=Dozent.find(e=>e.id==Standard.inhalt).name;
        const von=`${tag.getDate()}.${tag.getMonth()+1}.${tag.getFullYear()}`;
        const freitag=new Date(Standard.montag*1000);
        freitag.setDate(freitag.getDate() + 4);
        const bis=`${freitag.getDate()}.${freitag.getMonth()+1}.${freitag.getFullYear()}`;
        ueberschrift.appendChild(document.createTextNode(`Dozent: ${name} Woche: ${von} bis ${bis}`));
    } else if('klasse'==Standard.typ){
        const name=Standard.inhalt;
        const von=`${tag.getDate()}.${tag.getMonth()+1}.${tag.getFullYear()}`;
        const freitag=new Date(Standard.montag*1000);
        freitag.setDate(freitag.getDate() + 4);
        const bis=`${freitag.getDate()}.${freitag.getMonth()+1}.${freitag.getFullYear()}`;
        ueberschrift.appendChild(document.createTextNode(`Klasse: ${name} Woche: ${von} bis ${bis}`));
    } else if('tag'==Standard.typ) {
        const tag_nr=parseInt(Standard.inhalt);
        const name=wochentage[tag_nr];
        tag.setDate(tag.getDate() + tag_nr);
        const tag_str=`${tag.getDate()}.${tag.getMonth()+1}.${tag.getFullYear()}`;
        ueberschrift.appendChild(document.createTextNode(`Wochentag: ${name}  ${tag_str}`));
    } else { // raum
        const von=`${tag.getDate()}.${tag.getMonth()+1}.${tag.getFullYear()}`;
        const freitag=new Date(Standard.montag*1000);
        freitag.setDate(freitag.getDate() + 4);
        const bis=`${freitag.getDate()}.${freitag.getMonth()+1}.${freitag.getFullYear()}`;
        ueberschrift.appendChild(document.createTextNode(`Raum: ${Standard.inhalt} Woche: ${von} bis ${bis}`));
    }
    
    b.appendChild(ueberschrift);
    
    // b.appendChild(document.createTextNode(JSON.stringify(Standard)));
}

// Tabelle aufbauen
function starten_tabelle(bereich,unterricht){
    const b=document.getElementById(bereich);
    
    const tabelle=document.createElement('table');
    // tabelle.setAttribute('border',2);
    tabelle.style.border="2px solid black";
    const klassen_liste=Standard.klassen.map(e=>e.inhalt);
    const tag=new Date(Standard.montag*1000);
    
    // Kopfzeile der Tabelle
    if('tag'==Standard.typ){
        const tr=document.createElement('tr');
        for(const klasse of klassen_liste){ 
            const th=document.createElement('th');
            th.style.border="1px solid green";
            th.appendChild(document.createTextNode(klasse));
            tr.appendChild(th);
        }
        tabelle.appendChild(tr);
    }
    else {
        const wtage=['Mo','Di','Mi','Do','Fr'];
        const tr=document.createElement('tr');
        wtage.forEach((e,i)=> {
            const th=document.createElement('th');
            th.style.border="1px solid green";
            const tag_str=`${wtage[i]} ${tag.getDate()}.${tag.getMonth()+1}.${tag.getFullYear()}`;
            tag.setDate(tag.getDate()+1);
            th.appendChild(document.createTextNode(tag_str));
            tr.appendChild(th);
            // tr.appendChild(document.createElement('th').appendChild(document.createTextNode(`${wtage[i]} ${tag_str}`)));
        });
        tabelle.appendChild(tr);
    }
    
    // 6 X N leere Felder
    const spalten='tag'==Standard.typ?klassen_liste.length:wochentage.length;
    const zeilen=5;
    // zeile null für Tagesinfos und Termin
    const tr=document.createElement('tr');
    if('tag'===Standard.typ) {
        const td=document.createElement('td');
        td.style.border="1px solid brown";
        td.id=`feld_0_0`;
        td.setAttribute('colspan',spalten);
        tr.appendChild(td)
    }
    else for (let j=0;j<spalten;j++){
        const td=document.createElement('td');
        td.style.border="1px solid brown";
        td.id=`feld_0_${j}`;
        tr.appendChild(td)
    }
    // zeile 1 bis zeilen für die Zeiten
    tabelle.appendChild(tr);
    for(let i=1;i<=zeilen;i++) {
        const tr=document.createElement('tr');
        for(let j=0;j<spalten;j++){
            const td=document.createElement('td');
            td.style.border="1px solid gray";
            td.id=`feld_${i}_${j}`;
            tr.appendChild(td);
        }
        tabelle.appendChild(tr);
    };
    b.appendChild(tabelle);
    
   
    // Termine
    // kalender_termine in Spalte 0
    Wo_ist.filter(x=>x.typ==='kalender_termin' && 0===x.dozent_id).forEach(y=>{
        if('tag'==Standard.typ && y.tag !=Standard.inhalt) return;
        const ziel_bereich=('tag'===Standard.typ) ? 'feld_0_0' : `feld_0_${y.tag}`;
        const b = document.getElementById(ziel_bereich);
        if(! b && y.tag>4) return; // **  alert(`Programmierfehler Zeile 596 Bereich ${ziel_bereich} unbekannt`);
        const div=document.createElement('div');
           
        // div.style.background='#dddddd';
        div.style.margin=2;
        div.style.fontSize='smaller';
        const von=new Date(y.von*1000).toTimeString().substring(0,5);
        const bis=new Date(y.bis*1000).toTimeString().substring(0,5);
        const str= 0==y.bis || null==y.bis ? (0==y.von || null==y.von || '00:00'==von ? '' : `ab ${von}`) :  `${von} - ${bis}`; 
        // const str = '00:00'==bis ? ('00:00'==von ? '' : `ab ${von}`) : `${von} - ${bis}`; 
        if(''!=str) {
            div.appendChild(document.createTextNode(str)) ;
            div.appendChild(document.createElement('br'));
        }
        // div.appendChild(document.createTextNode(y.typ)) ;
        if(y.kurzinfo) {
            // div.appendChild(document.createElement('br'));
            div.appendChild(document.createTextNode(y.kurzinfo)) ;
        }
        else  div.appendChild(document.createTextNode('Kalendertermin ?')) ;
        b.appendChild(div);

    });
    
    // Dozenten Unterrichtsfenster
    if('dozent_id'==Standard.typ) {
        Wo_ist.filter(x=>x.dozent_id==Standard.inhalt && x.typ=='schule').forEach(y=> {
            const spalte=y.tag;
            // ** da scheint es einen bug zu geben dass spalten groer sein können
            if(spalte< spalten) for(let zeile=zeile_nr(y.von);zeile <= zeile_nr(y.bis);zeile++){
                // alert(`feld_${zeile}_${spalte}`);
                document.getElementById(`feld_${zeile}_${spalte}`).style.backgroundColor='#f0f0ff';
                 // document.getElementById(`feld_${zeile}_${spalte}`).style.backgroundColor='#0000ff';
            }
        });
    }
    
    
    // die besonderen Termine (wo_ist_cache) eintragen
    if('dozent_id'==Standard.typ) Wo_ist_cache.forEach(x => {
        const zeile=zeile_nr(x.von);
        // alert(JSON.stringify(x));
        const spalte=x.tag;
        // const spalte=_wochentag_nr(x.von);
        const b=document.getElementById(`feld_${zeile}_${spalte}`);
        const div=document.createElement('div');
           
        div.style.background='#dddddd';
        div.style.margin=2;
        div.style.fontSize='smaller';
        const von=new Date(x.von*1000).toTimeString().substring(0,5);
        const bis=new Date(x.bis*1000).toTimeString().substring(0,5);
        const str = '00:00'==von ? '' : '00:00'==bis ? ('00:00'==von ? '' : `ab ${von}`) : `${von} - ${bis}`; 
        if(''!=str) {
            div.appendChild(document.createTextNode(str)) ;
            div.appendChild(document.createElement('br'));
        }
        div.appendChild(document.createTextNode(x.typ)) ;
        if(x.kurzinfo) {
            div.appendChild(document.createElement('br'));
            div.appendChild(document.createTextNode(x.kurzinfo)) ;
        }
        b.appendChild(div);

    }
    );

    // bei tag die Sitzungen eintragen
    if('tag'==Standard.typ) {
        const tag_nr=parseInt(Standard.inhalt);
        const alt={von:0,bis:0};
        Wo_ist.filter(x=>x.tag==tag_nr && x.typ=='sitzung').forEach(y=> {
            if(alt.von!=y.von&& alt.bis!=y.bis) {
                alt.von=y.von; 
                alt.bis=y.bis;
                for(let spalte=0;spalte<spalten;spalte++){
                    for(let zeile=zeile_nr(y.von);zeile <= zeile_nr(y.bis);zeile++){
                        const b=document.getElementById(`feld_${zeile}_${spalte}`)
                        const div=document.createElement('div');
                        div.style.background='#dddddd';
                        div.style.margin=2;
                        div.style.fontSize='smaller';
                        const von=new Date(y.von*1000).toTimeString().substring(0,5);
                        const bis=new Date(y.bis*1000).toTimeString().substring(0,5);
                        const str = '00:00'==bis ? ('00:00'==von ? '' : `ab ${von}`) : `${von} - ${bis} ${y.kurzinfo}`; 
                        div.appendChild(document.createTextNode(str)) ;
                        div.appendChild(document.createElement('br'));
    
                        // div.appendChild(document.createTextNode(y.typ)) ;
                        b.appendChild(div);
                    }
                }
            }
        });
    }
    
    
    
    // dort Unterricht eintragen
    if('dozent_id'==Standard.typ) U_zeit.filter(e=>e.dozent_id==Standard.inhalt).forEach(e => _u2bereich(e));
    else if('klasse'==Standard.typ) U_zeit.filter(e=>e.klasse==Standard.inhalt).forEach(e => _u2bereich(e));
    else if('tag'==Standard.typ) { // if('tag'==Standard.typ);
        const v= parseInt(Standard.inhalt); 
        const tag_nr= (6==v) ? 0 : v + 1;
        U_zeit.filter(x=>parseInt(new Date(x.von*1000).getDay())==tag_nr).forEach(y=>_u2bereich_tag(y));
    }
    else { // raum
        U_zeit.filter(x=>x.raum==Standard.inhalt).forEach(e => _u2bereich(e));
    }
    
    // den link für neu eintragen
    for(let zeile=1;zeile<=zeilen;zeile++) {
        const tr=document.createElement('tr');
        for(let spalte=0;spalte<spalten;spalte++){
            ausgabe_neu(`feld_${zeile}_${spalte}`);
        }
    }
        
    // trägt ein U_zeit Element ein
    function _u2bereich(u){
        const zeile=zeile_nr(u.von);
        const spalte=_wochentag_nr(u.von);
        const b=document.getElementById(`feld_${zeile}_${spalte}`);
        const div=document.createElement('div');
        div.id=`u_${u.id}`;
        b.appendChild(div);
        b.appendChild(document.createElement('br'));
        ausgabe_html(div.id,u.id,u);
    }

     
    function _u2bereich_tag(u){
        const zeile=zeile_nr(u.von);                
        const spalte=klassen_liste.indexOf(u.klasse);
        const b=document.getElementById(`feld_${zeile}_${spalte}`);
        const div=document.createElement('div');
        div.id=`u_${u.id}`;
        b.appendChild(div);
        ausgabe_html(div.id,u.id,u);
    }
        



}

// trägt ein U_zeit Element ein
function u_bereich(u){ 
    alert(JSON.stringify(u));
        const zeile=zeile_nr(u.von);
        const spalte='tag'===Standard.typ ? Klassen_liste.indexOf(u.klasse) : _wochentag_nr(u.von);
        const b=document.getElementById(`feld_${zeile}_${spalte}`);
        if(!b) alert(`feld_${zeile}_${spalte}`);
        const div=document.createElement('div');
        div.id=`u_${u.id}`;
        b.appendChild(div);
        // b.appendChild(document.createElement('br'));
        ausgabe_html(div.id,u.id,u);
}



// Zeile aus Zeit erzeugen, hier die Zeiten anpassen
function zeile_nr(zeit){
    const zeit_obj=new Date(zeit*1000);
    const stunde=zeit_obj.getHours();
    if(stunde>14) return(5);
    else if(stunde>12) return(4);
    else if(stunde>11) return(3);
    else if(stunde>9) return(2);
    else if(0==stunde) return(0);
    else return(1);
}
    
// wochentagnr aus zeit erzeugen Montag ist 0!
function _wochentag_nr(zeit){
    const zeit_obj=new Date(zeit*1000);
    const v=zeit_obj.getDay();
    const tag=(v==0)?6:v-1;
    return(tag);
}


// starten_zeiten wo_ist einträge
function starten_zeiten(bereich){
    const b=document.getElementById(bereich);
    const tabelle=document.createElement('table');
    tabelle.border=2;
    tabelle.style.fontSize='small';    
    
    let liste;
    
    // tabellenfeld in Tabellenzeile tab einhängen
    function tab(tr,text){
        const td=document.createElement('td');
        td.style.border="1px solid gray";
        td.appendChild(document.createTextNode(text));
        tr.appendChild(td);
    }
    const wochentage=['Mo','Di','Mi','Do','Fr','Sa','So'];
    
    // alert(JSON.stringify(Wo_ist))
    if('dozent_id'==Standard.typ) liste=Wo_ist.filter(x => x.jahreswoche!='0' && x.dozent_id==Standard.inhalt).sort((x,y) => x.tag - y.tag);
    else if('tag'==Standard.typ) liste=Wo_ist.filter(x => x.jahreswoche!='0' && x.tag==Standard.inhalt).sort((x,y) => x.dozent_id - y.dozent_id);
    else liste=Wo_ist.filter(x => x.jahreswoche!='0').sort((x,y) => (x.tag*1000+x.dozent_id) - (y.tag*1000+y.dozent_id));
    
    Wo_ist_cache=liste;
    
    let alt='';
    let alt1='';
    
    for (const wo_ist of liste){
        const tr=document.createElement('tr');

        if('tag'==Standard.typ){
            const doz= Dozent.find(x=>x.id==wo_ist.dozent_id) ?? {'name':'??'};
            if(alt==wo_ist.dozent_id) tab(tr,'');
            else tab(tr,doz.name ); 
            const von=new Date(wo_ist.von*1000).toTimeString().substring(0,5);
            if(wo_ist.von > 0 && von !='00:00') tab(tr,von );
            else tab(tr,'');
            const bis=new Date(wo_ist.bis*1000).toTimeString().substring(0,5);
            if(wo_ist.bis > 0 && bis!='00:00') tab(tr,bis);
            else tab(tr,'');
        // alert(JSON.stringify(wo_ist));
        }
       else {
            if(alt==wo_ist.tag) tab(tr,'');
            else tab(tr,wochentage[wo_ist.tag]);
            alt=wo_ist.tag;
            if('klasse'==Standard.typ){
                const doz= Dozent.find(x=>x.id==wo_ist.dozent_id) ?? {'name':'??'};
                tab(tr,doz.name);
            }
            // if(x.von > 0) tab(tr,new Date(x.von*1000).toTimeString().substring(0,5));
            const von=new Date(wo_ist.von*1000).toTimeString().substring(0,5);
            if(wo_ist.von > 0 && von !='00:00') tab(tr,von );
            else tab(tr,'');
            const bis=new Date(wo_ist.bis*1000).toTimeString().substring(0,5);
            if(wo_ist.bis > 0 && bis!='00:00') tab(tr,bis);
            else tab(tr,'');
        }
        
        tab(tr,wo_ist.typ);
        if(wo_ist.kurzinfo) tab(tr,wo_ist.kurzinfo);
        else tab(tr,'');
        
        tabelle.appendChild(tr);
    }

    
    
    // alert(JSON.stringify(liste));
    
    b.appendChild(tabelle);
}

// link, um neuen Unterricht anzulegen. Bereicht ist feld_zeile_spalte
function ausgabe_neu(bereich){
    if(''==bereich) return;
    const l=bereich.split('_');
    const zeile=l[1];
    const spalte=l[2];
    const b=document.getElementById(bereich);
    const neu=document.createElement('a');
    neu.innerText="neu";
    neu.id=`neu_${spalte}_${zeile}`;
    neu.href=`javascript:neu('${neu.id}',${zeile},${spalte})`;
    b.appendChild(neu);
} 


// "neue" Funktionen in lambda-Schreibweise

// fügt einen Text ein als Knoten optional mit tag z.B. <b>..</b>
const text_knoten = (eltern_knoten,text,html_tag='') => {
    const textknoten=document.createTextNode(text);
    if(''==html_tag) {
        eltern_knoten.appendChild(document.createTextNode(text));
        return(textknoten);
    }
    else {
        const knoten=document.createElement(html_tag);
        if(! knoten) {
            eltern_knoten.appendChild(document.createTextNode('(Programmfehler: '+ html_tag + ') '+text));
            return(textknoten);
        }
        else {
            eltern_knoten.appendChild(knoten.appendChild(textknoten));
            return(knoten);
        }
    }
}

// fügt einen Link ein
const link_knoten = (eltern_knoten,text,href) => {
    const a=document.createElement('a');
    a.setAttribute('href',href);
    text_knoten(a,text);
    eltern_knoten.appendChild(a);
}

// fügt ein Listenelement in eine Liste ein, optional als link
const liste_knoten = (eltern_knoten,text,href='',id='',weiterer_text) => {
    const li=document.createElement('li');
    eltern_knoten.appendChild(li);
    if(id) li.id=id;
    if(''==href) text_knoten(li,text);
    else link_knoten(li,text,href);
    if(weiterer_text) text_knoten(li,' '+weiterer_text);
    return(li);
}

// wiederherstellen = wenn ein anderes Feld angeklickt wird, wird das urprüngliche Feld in html rekonstruiert 

function wiederherstellen(bereich,id,neu_id=''){
    
    // alert("wiederherstellen("+bereich+','+id+") alt: "+JSON.stringify(U_alt));
    
    // unfertiges Editieren 
    if(0==U_alt.id && U_alt.neu_id!=0 && document.getElementById('u_0')) { // ** cheat damit u_0 nicht falsch ist 
        const b1=document.getElementById('u_0');
        const b2=b1.parentNode;
        b2.removeChild(b1);
        
        ausgabe_neu(b2.id);                    
    }
    else {
        if(''!=U_alt.bereich) {
            const b=document.getElementById(U_alt.bereich);
            if(!b) return;
            b.innerHTML='';
            ausgabe_html(U_alt.bereich,U_alt.id,U_zeit.find(e=>e.id==U_alt.id));
        }
    }
    if(bereich) U_alt.bereich=bereich;
    U_alt.id=id;
    U_alt.neu_id=neu_id;
    
}



// neu wiederherstellen
// ** soll absolet
/*
function neu_wiederherstellen(bereich,zeile,spalte,typ,inhalt){
    if(! bereich) return;
    const b=document.getElementById(bereich);
    const neu=document.createElement('a');
    neu.innerText="neu";
    neu.id=`neu_${zeile}_${spalte}`;
    // '$jahreswoche',$wochentag,$editier_zeile,'$typ','$was')\
    const v=neu_bereich.split('_'); // neu_jahr_woche_tag_zeile
    
    const blocktag=`${v[1]}_${v[2]}_${v[3]}`;
    // const zeile1=v[4];
    let typ1, was1;
    if('dozent'==Standard.typ) typ1='dozent_id'; // ** obsolet
    else typ1=Standard.typ;
        neu.href=`javascript:neu('${neu.id}','${blocktag}',${zeile},'${typ}','${inhalt}')`;
    b.appendChild(neu);
}
*/
    
// zeigt den Unterricht im editiermodus
function ausgabe_editieren(bereich,id,unterricht){

    const b=document.getElementById(bereich);
    if(! b) alert("Programmierfehler ausgabe_editieren bereich= "+bereich);
    if(id) wiederherstellen(bereich,id,'');
    const typ=Standard.typ;
    const div=document.createElement('p');
    div.style.backgroundColor='white';
	div.style.border="3px solid blue";
    div.setAttribute('id','div_unterricht');

    // von und bis
    // eingabebereich von ** onchange falsch
    const input_von=document.createElement('input');
	input_von.type='text';
	input_von.setAttribute('id','von');
	input_von.setAttribute('onchange',`u_aktiviere('von',${id},'von')`);
	input_von.setAttribute('size','1px');// ** verstehe nicht warum 1pt
    const u_von= new Date(unterricht.von*1000).toTimeString().substring(0,5);
	input_von.setAttribute('value',u_von);
    div.appendChild(input_von);	
    div.appendChild(document.createTextNode(' - '));
    // bis
    const input_bis=document.createElement('input');
	input_bis.type='text';
	input_bis.setAttribute('id','bis');
    input_bis.setAttribute('onchange',`u_aktiviere('bis',${id},'bis')`);
	input_bis.setAttribute('size','1pt'); // ** verstehe nicht warum 1pt
    const u_bis= new Date(unterricht.bis*1000).toTimeString().substring(0,5);
	input_bis.setAttribute('value',u_bis);
    div.appendChild(input_bis);
    
    // Info
    div.appendChild(document.createElement('br'));
    const info=document.createElement('span');
    info.setAttribute('id','info_bereich');
    // dozent
    // Klasse und dozent
    if('dozent_id' == Standard.typ) {
        const doz_name = Dozent.find(e=>e.id==unterricht.dozent_id).name ?? 'undef';
        info.appendChild(document.createTextNode(doz_name+' '));
    }
    else if('klasse'== Standard.typ)  info.appendChild(document.createTextNode(unterricht.klasse+' '));
             			
    div.appendChild(info);
    div.appendChild(document.createElement('br'));	

    // Auswahl der Unterrichtsformen
    const unterrichtsform=document.createElement('select');
    unterrichtsform.style.fontSize='smaller';
    unterrichtsform.setAttribute('id','unterrichtsform');
    unterrichtsform.setAttribute('onchange',`u_aktiviere('unterrichtsform',${id},'unterrichtsform')`);
    const unterrichtsformen=[
        {'schluessel':'praesenz','wert':'Präsenzunterricht'},
        {'schluessel':'Aufgabe','wert':'Aufgabe'},
        {'schluessel':'Projekt','wert':'Projektunterricht'},
        {'schluessel':'Online','wert':'Online'},
        {'schluessel':'SOL','wert':'selbst organisiertes Lernen'}
	];
    for(const u_form of unterrichtsformen){
        const o = new Option(u_form.wert,u_form.schluessel);
        if(unterricht.unterrichtsform==u_form.schluessel) o.setAttribute('selected','selected');
        unterrichtsform.appendChild(o);
    }
    div.appendChild(unterrichtsform);
    
    // Auswahl der Lernfelder oder Klassen
    // dargestellt als Liste hellgraues Feld mit kleinerer Schrift
	const auswaehlen=document.createElement('ul');
	auswaehlen.style.backgroundColor="#eeeeee";
	auswaehlen.id='auswahl';
	auswaehlen.style.fontSize='smaller';
	auswaehlen.style.margin=0;
	auswaehlen.style.padding=0;
	auswaehlen.style.listStyle='none inside';
    div.appendChild(auswahl(id,Standard.typ,unterricht));
    
    const raumbelegung = U_zeit.filter(x=>x.von<=unterricht.bis && x.bis>=unterricht.bis && x.raum && x.raum.length>1).map(x => { 
        {
            const res={};
            res.raum=x.raum;
            res.klasse=x.klasse;
            return(res);
        } 
    });
    
//    alert(JSON.stringify(raumbelegung));
    
    const raum_auswahl=document.createElement('select');
    raum_auswahl.style.fontSize='smaller';
    raum_auswahl.setAttribute('id','raum');
    raum_auswahl.setAttribute('onchange',`u_aktiviere('raum',${id},'raum')`);
    for(const raum of Raeume){
        const r=raumbelegung.find(x=>x.raum===raum);
        let raum1=raum;
        if(undefined != r) raum1=r.klasse===unterricht.klasse ? `${raum} diese Klasse` : `${raum} BELEGT ${r.klasse}`; 
        const o = new Option(raum1,raum);
        if(unterricht.raum===raum) o.setAttribute('selected','selected');
        o.style.background="green";
        // alert(o);
        // alert(JSON.stringify(o));
        raum_auswahl.appendChild(o);
    }
    div.appendChild(document.createTextNode('Raum: '));
    div.appendChild(raum_auswahl);
    
    // Hinweis		
    div.appendChild(document.createElement('br'));	
    div.appendChild(document.createTextNode('Hinweis: '));		
			// div.appendChild(text_eingabe(this.id,'hinweis','15',this.hinweis));
    const hinweis=document.createElement('input');
	hinweis.type='text';
	hinweis.setAttribute('id','hinweis');
	hinweis.setAttribute('onchange',`u_aktiviere('hinweis',${id},'hinweis')`);
	hinweis.setAttribute('size','10pt');
	if(unterricht.hinweis) hinweis.setAttribute('value',unterricht.hinweis);
	div.appendChild(hinweis);
    
    b.appendChild(div);
}

// zeigt den Unterricht ohne Editieren, nur links
function ausgabe_html(bereich,id,u){
    const b=document.getElementById(bereich);
    b.innerHTML='';
        
    const typ=Standard.typ;
    const u_von= new Date(u.von*1000).toTimeString().substring(0,5);
    const u_bis= new Date(u.bis*1000).toTimeString().substring(0,5);
    
    // link zum editieren
    const editieren=document.createElement('a');
    
    editieren.href=`javascript:u_editieren('${bereich}',${id})`;
    editieren.innerText=`${u_von} - ${u_bis}`;
    b.appendChild(editieren);

    // link zum loeschen
    const loeschen=document.createElement('a');
    loeschen.href=`javascript:u_loeschen('${bereich}',${id})`;

    loeschen.innerText='x';
    b.appendChild(document.createTextNode(' '));
    b.appendChild(loeschen);
    
    // erste Zeile info
    b.appendChild(document.createElement('br'));
    const info=document.createElement('b');
    if('dozent_id'==typ) info.innerText=u.klasse;
    else if('raum'==typ) info.innerText=u.klasse;
    else info.innerText=u.dozent;
    if('praesenz'!=u.unterrichtsform && u.unterrichtsform) b.appendChild(document.createTextNode(`(${u.unterrichtsform})`));
    b.appendChild(info);
    
    // das Fach / Lernfeld / Schwerpunkt
    if(u.fach) {
        b.appendChild(document.createElement('br'));
        b.appendChild(document.createTextNode(u.fach));
    }
    
    if(u.thema){
        b.appendChild(document.createElement('br'));
        b.appendChild(document.createTextNode(u.thema));
    }
    else if(u.lernfeld){
        b.appendChild(document.createElement('br'));
        b.appendChild(document.createTextNode(u.lernfeld));
        if(u.schwerpunkt)  b.appendChild(document.createTextNode(` ${u.schwerpunkt}`));
    }
    
    if('raum'==Standard.typ) {
        b.appendChild(document.createElement('br'));
        b.appendChild(document.createTextNode(u.dozent));
    }
    else if(u.raum){
         b.appendChild(document.createElement('br'));
        b.appendChild(document.createTextNode(`Raum: ${u.raum}`));
    }
    
    if(u.hinweis){
        b.appendChild(document.createElement('br'));
        b.appendChild(document.createTextNode(u.hinweis));
    }
    
}
    
// Neuer Unterricht
// function neu(bereich,jahreswoche,tag,zeile,was,inhalt){
// function neu(bereich,blocktag,zeile,typ,inhalt){
function neu(bereich,zeile,spalte){
	const b=document.getElementById(bereich);
    

    wiederherstellen(bereich,0,b.id);
    
    const klassen_liste=Standard.klassen.map(e=>e.inhalt);
	
    b.innerHTML='';
    // das alte neu löschen
    // alert(bereich);
    // b.removeChild(document.getElementById(`neu_${zeile}_${spalte}`));
    
    const kinder_knoten=b.childNodes;
    const kinder_knoten_zahl=kinder_knoten.length;
	if(kinder_knoten_zahl>2){
		b.removeChild(kinder_knoten[kinder_knoten_zahl-1]);
		b.removeChild(kinder_knoten[kinder_knoten_zahl-2]);
		}		

	const p=document.createElement('p');
    p.setAttribute('id','u_0');

	b.parentNode.replaceChild(p,b);
    
    
    
    // als closure
    // {'von':sekunden_von, 'bis':sekunden_bis} alles utc
    function standardzeit(blocktag,zeile) {
        let von;
        let bis;
        
        const feld = blocktag.split('_');
        
        let derTag = new Date(Date.UTC(feld[0],0,1));
        const wtag=derTag.getUTCDay();
        if(0==wtag) derTag=new Date(Date.UTC(feld[0],0,2)); // wenn Neujahr ein Sonntag ist, fängt Montag die erste Woche an
        else if(wtag<4) derTag=new Date(Date.UTC(feld[0]-1,11,31-(wtag-2) ));
        else derTag=new Date(Date.UTC(feld[0],0,wtag-1));
        
        derTag.setDate(derTag.getDate() + (feld[1] -1)* 7 + parseInt(feld[2]));
        
        /*
        else if(1==wtag); // Montag Neujahr korrekt
        else if(2==wtag)  d=new Date(Date.UTC(feld[0]-1,11,31)); // wenn Neujahr ein Dienstag ist, fängt Silvester die erste Woche an
        else if(3==wtag)  d=new Date(Date.UTC(feld[0]-1,11,30)); // wenn Neujahr ein Dienstag ist, fängt Silvester die erste Woche an
        else if(5==wtag) d=new Date(Date.UTC(feld[0],0,4));
        */
        
        
		switch(zeile) {
			case 1: von='8:30'; bis='10:00';break;
			case 2: von='10:30'; bis='12:00';break;
			case 3: von='12:00'; bis='13:00';break;
			case 4: von='13:00'; bis='14:30';break;
			default: von='15:00'; bis='16:30';break;
			}
		
        const vonl=von.split(':');
        const bisl=bis.split(':');
        
        
        const vonTag= new Date(derTag.getTime());
        vonTag.setHours(vonl[0]);
        vonTag.setMinutes(vonl[1]);
        const bisTag= new Date(derTag.getTime());
        bisTag.setHours(bisl[0]);
        bisTag.setMinutes(bisl[1]);
		
        return({'von':Math.floor(vonTag.getTime()/1000),'bis':Math.floor(bisTag.getTime()/1000)});
		}
		
    const blocktag= Standard.typ=='tag' ? `${Standard.jahreswoche}_${Standard.inhalt}` : `${Standard.jahreswoche}_${spalte}`;
    
    
    const zeiten = standardzeit(blocktag, zeile);
    
    let konflikt={};
    
    if('dozent_id'==Standard.typ) konflikt=U_zeit.find(e => Standard.inhalt==e.dozent_id && e.bis>=zeiten.von && e.von <=zeiten.bis);
    else if('klasse'==Standard.typ) konflikt=U_zeit.find(e => Standard.inhalt==e.klasse && e.bis>=zeiten.von && e.von <=zeiten.bis);
    else if('tag'==Standard.typ) {
        konflikt=U_zeit.find(e => klassen_liste[spalte]==e.klasse && e.bis>=zeiten.von && e.von <=zeiten.bis);
    }
    
    /*
    if('dozent_id'==Standard.typ) konflikt=U_zeit.find(e => Standard.inhalt==e.dozent_id && e.bis>=zeiten.von && e.von <=zeiten.bis);
    else konflikt=U_zeit.find(e => inhalt==e.klasse && e.bis>=zeiten.von && e.von <=zeiten.bis);
    */
    /*
    if('dozent_id'==inhalt){
        konflikt=U_zeit.find(e => {
            if(inhalt!=e.dozent_id) return(false);
            // if(dieser_unterricht.klasse==e.klasse) return(false);
            if(e.bis>=zeiten.von && e.von <=zeiten.bis) {
                return(true);
            }
            else return(false);
        });
    }

    else {
        konflikt={};
        alert("179 Konfliktbehandlung was ist "+typ);
    }
*/    
    /*
    else if('klasse'==typ){
        const konflikt=U_zeit.find(e => {
            // alert('null ' +dieser_unterricht.dozent_id+' id '+name_id);
            if(name_id !=e.dozent_id) return(false);
            if(name_id ==dieser_unterricht.dozent_id) return(false);
            if(e.bis>=dieser_unterricht.von && e.von <=dieser_unterricht.bis) return(true);
            else return(false);
        });
    */
    
    
    // ** nur für typ Dozent richtig!
    
    const u={'von': zeiten.von,'bis' : zeiten.bis,'klasse': '','dozent_id': '','hinweis': '','unterrichtsform':'praesenz'};
    if('dozent_id'==Standard.typ) u.dozent_id=Standard.inhalt;
    else if('klasse'==Standard.typ) u.klasse=Standard.inhalt;
    else u.klasse=klassen_liste[spalte];

    if(undefined!=konflikt){
        let str=JSON.stringify(konflikt);
        if('dozent_id'==Standard.typ) str=`${konflikt.klasse} ${konflikt.lernfeld}`;
        else if('klasse'==Standard.typ) str=`${konflikt.dozent} ${konflikt.lernfeld}`;
        else if('tag'==Standard.typ) str=`${konflikt.klasse} ${konflikt.dozent} ${konflikt.lernfeld}`;
        if(confirm(`Fortsetzen trotz zeitlicher Überschneidung? ${str}`)) {
            ausgabe_editieren('u_0',0,u);
        }
    }
    else ausgabe_editieren('u_0',0,u);
}


// editieren von Unterricht
function u_editieren(bereich,id){
    document.getElementById(bereich).innerHTML='';
    ausgabe_editieren(`${bereich}`,id,U_zeit.find(e=>e.id==id));
}

	
// lösche einen einzelnen Unterricht
function u_loeschen(bereich,id){
    var aufruf=`stdplan_editieren_eintragen.php?typ=u_loeschen&id=${id}&planung=${Standard.planung}`;
    var b=document.getElementById(bereich);
    var req = getXMLHttpRequest();
	if(! req) {alert("kann kein HttpRequest aufbauen"); return;}
	
	req.onreadystatechange = function(){
		if(req.readyState == 4) {
			const ergebnis= req.responseText;
			if('{' != ergebnis.substr(0,1) ) {alert('Fehler (loeschen): '+ergebnis); return;}
			const e= JSON.parse(ergebnis);
			if('diagnostik'==e.ergebnis) alert("Diagnostik (loeschen):" + ergebnis);
			else if('ok'!=e.ergebnis) {
				alert("nicht erfolgreich: "+e.ergebnis+"\n"+ergebnis); 
				return;
            }
            // entferne aus U_zeit
            U_zeit.splice(U_zeit.findIndex(e => e.id==id) ,1);
            // Eintrag löschen
            if(b) b.remove();
            const tabelle= 'stundenplan_in_planung'==Stundenplan_tabelle ? 1 : 0;
            info_bereich();
		}
    }
	req.open("GET",aufruf);
	req.send(null);	
}
	

// * soll anders gelöst werden
// einfuegen und kopieren von Unterricht
function einfuegen(bereich,jahreswoche,tag,zeile,typ,was,inhalt){
// alert("hier "+bereich);
	var b=document.getElementById(bereich);
	if(!b) {alert("Fehler in stundenplan.js einfügen: Unbekannter Bereich: "+bereich); return;}
	var b_letzte=b.lastChild;
	if(b_letzte) {
		var b1_letzte=b.cloneNode(true);
		b_letzte.innerHTML='';
		}
	b.innerHTML=''; // damit "neu" nicht stehenbleibt

	var p=document.createElement('p');
	p.setAttribute('id','p_bereich');
	// p.style.backgroundColor='';
	b.appendChild(p);

	var req = getXMLHttpRequest();
	if(! req) {alert("kann kein HttpRequest aufbauen"); return;}

	var aufruf="stdplan_editieren_eintragen.php?typ=einfuegen&planung="+Standard.planung+
		"&jahreswoche="+jahreswoche+"&tag="+tag+"&zeile="+zeile+"&was="+was+"&inhalt="+inhalt+"&kopiertyp="+typ;
	req.onreadystatechange = function(){
		if(req.readyState == 4) {
			var ergebnis= req.responseText;
			if('{' != ergebnis.substr(0,1) ) {alert('Fehler (einfuegen): '+ergebnis); return;}
			var e= JSON.parse(ergebnis);
			if('diagnostik'==e.ergebnis) alert("Diagnostik (einfuegen):" + ergebnis);
			else if('info' ==e.ergebnis) {alert("Nicht eingefügt: "+ e.info);return;}
			else if('fehler'==e.ergebnis) {alert(e.info);return;}
			else if('ok'!=e.ergebnis) {
				alert("nicht erfolgreich: "+e.ergebnis+"\n"+ergebnis); 
				return;
				}
			if('unterricht'!=typ) {window.location.reload();return;}

			b.appendChild(b1_letzte);

			var p_bereich='u_'+e.id;
			var p=document.getElementById('p_bereich');
			p.setAttribute('id',p_bereich);
			unterricht=new Unterricht(p_bereich);
			unterricht.von=e.von;
			unterricht.bis=e.bis;
			unterricht.klasse=e.klasse;
			unterricht.lernfeld=e.lernfeld;
			unterricht.schwerpunkt=e.schwerpunkt;
			unterricht.dozent=e.dozent;
			unterricht.id=e.id;
			// if('klasse'==was) unterricht.klasse=e.inhalt;
			// else if('dozent_id'==was) unterricht.dozent=e.inhalt;
			// else alert('stundenplan.js Z 234 '+was);
			p.innerHTML=unterricht.html(); 

			// Pfeile anpassen
			var b_zurueck=document.getElementById("zurueck");
			if(b_zurueck){
				b_zurueck.innerHTML="";
				var zurueck=document.createElement('a');
				var zurueck_text="javascript:navi_zurueck("+e.navi_session+")";
				zurueck.setAttribute('href',zurueck_text);
				zurueck.innerHTML=" &#8617; 1zurück";
				b_zurueck.appendChild(zurueck); // bei neuem Element kann es kein vor geben!
				}
			var b_vor=document.getElementById("vorwaerts");
			if(b_vor) b_vor.innerHTML="1vor  &#8618;";
            
			
			// merken für spätere Wiederherstellung
			alter_unterricht=unterricht;



	
			// document.location.reload();
			}
		}
	req.open("GET",aufruf);
	req.send(null);			
	}

/*
function kopieren(jahreswoche,tag,kopiertyp,was,inhalt,tabelle){
	_kopieren(jahreswoche,tag,kopiertyp,was,inhalt,tabelle,'',tabelle);
	}

function kopieren_zwei(jahreswoche,id,kopiertyp,was,inhalt,tabelle,zielwoche,tag,zeile,ansicht){
	var tag1 = tag+1;
	if('unterricht'== kopiertyp) {
		if('tag'==ansicht) var bereich="neu_"+inhalt+"_"+zielwoche+'__'+zeile;	
		else if('klasse'==ansicht) var bereich="neu_"+inhalt+"_"+zielwoche+'_'+tag+'_'+zeile;	
		else var bereich="neu__"+zielwoche+'_'+tag+'_'+zeile;	
		}
	else if('tag'==kopiertyp) {
		if('tag'==ansicht) var bereich='tag_'+inhalt;
		else var bereich='tag_'+tag1;
		}
	else if('woche'==kopiertyp) var bereich='wochenbereich';

	if('unterricht'== kopiertyp && 'tag'==ansicht) _kopieren(jahreswoche,id,kopiertyp,was,inhalt,tabelle,zielwoche,tag,zeile,bereich);
	else _kopieren(jahreswoche,id,kopiertyp,was,inhalt,tabelle,zielwoche,tag1,zeile,bereich);
// kopieren('2018_18',0,'woche','tag','4','stundenplan_in_planung')
// javascript:kopieren_zwei('2018_16',0,'woche','klasse'=tag,'TAG'Nr,'stundenplan','2018_18',0,0,'tag')
	}


function _kopieren(jahreswoche,tag,kopiertyp,was,inhalt,tabelle,zielwoche,zieltag,zeile,bereich){	

	// var b = document.getElementById(bereich);
	// if(!b) alert("Programmfehler Bereich "+bereich);
// getElementsByTagName
	var aufruf="stdplan_editieren_eintragen.php?typ=kopieren&kopiertyp=" +kopiertyp+ "&jahreswoche=" +jahreswoche+ "&tag="+ tag + 
		"&was=" + was+
		"&inhalt=" +inhalt+ "&tabelle=" +tabelle;
	// Markierung erzeugen oder löschen
	var req = getXMLHttpRequest();
	if(! req) {alert("kann kein HttpRequest aufbauen"); return;}

	req.onreadystatechange = function(){
		if(req.readyState == 4) {
			var ergebnis= req.responseText;
			if('{' != ergebnis.substr(0,1) ) {alert('Fehler (kopieren): '+ergebnis); return;}
			var e= JSON.parse(ergebnis);
			if('diagnostik'==e.ergebnis) alert("Diagnostik (kopieren):" + ergebnis);
			else if('ok'!=e.ergebnis) {
				alert("nicht erfolgreich: "+e.ergebnis+"\n"+ergebnis); 
				return;
				}	
			// b.style.background=e.farbe;
			liste=e.loeschen;

			for(var i=0 ;i<liste.length;i++) {
				var b=document.getElementById(liste[i]);
				if(b) b.style.background='';
				}
			liste=e.markieren;
			for(var i=0 ;i<liste.length;i++) {
				var b=document.getElementById(liste[i]);
				if(b) b.style.background=e.farbe;
				}
			// die Links zum einfügen aktivieren oder deaktivieren
			liste_aus=e.display_aus;
			for(var i=0;i<liste_aus.length;i++) {
				var b=document.getElementById(liste_aus[i]);
				if(b) b.style.display='none';
				}
			liste_an=e.display_an;
			for(var i=0;i<liste_an.length;i++) {
				var b=document.getElementById(liste_an[i]);
				if(b) b.style.display='inline';
				}
			if(zielwoche){
				if (e.markieren.length > 0) {
					if('woche'==kopiertyp && 'tag'== was) inhalt++; // ** CHEAT
// alert("\neinfuegen("+bereich+','+zielwoche+','+zieltag+','+zeile+','+kopiertyp+','+was+','+inhalt+');');
					einfuegen(bereich,zielwoche,zieltag,zeile,kopiertyp,was,inhalt);
					}
				}
			}
		}
	req.open("GET",aufruf);
	req.send(null);			
	}
*/


/*+++++++++++++++++
+ Aktivierung
+ schickt Stundenplanänderungen an den server
+++++++++++++++++++++++*/
// Aktivierung von, bis, raum und Bemerkungen
function u_aktiviere(bereich,id,was){
    const b=document.getElementById(bereich);
    const u=U_zeit.find(e => e.id==id);
    let inhalt=b.value;
			
	if('von'==was) inhalt=_neue_zeit(inhalt,u.von);
    else if('bis'==was) inhalt=_neue_zeit(inhalt,u.bis);
    
    
	var aufruf="stdplan_editieren_eintragen.php?typ=u_aendern&id="+id+
		"&was="+was+"&inhalt="+inhalt+"&planung="+Standard.planung;

    const req = getXMLHttpRequest();
	if(! req) {alert("kann kein HttpRequest aufbauen"); return;}
	req.onreadystatechange = function(){
		if(req.readyState == 4) {
			const ergebnis= req.responseText;
			if('{' != ergebnis.substr(0,1) ) {alert('Fehler (aendern): '+ergebnis); return;}
			const e= JSON.parse(ergebnis);
			if('diagnostik'==e.ergebnis) alert("Diagnostik (aendern):" + ergebnis);
			else if('fehler'==e.ergebnis) {alert("Fehler (bei Aufruf aendern):" + e.info); return;}
			else if('ok'!=e.ergebnis) {
				alert("nicht erfolgreich: "+e.ergebnis+"\n"+ergebnis); 
				return;
				}	
			else b.style.background='#33FF33';
            
            if('bis'==was) u.bis=inhalt; 
			else if('von'==was) u.von=inhalt;
			else if('hinweis'==was) u.hinweis=inhalt;
            else if('unterrichtsform' ==was) u.unterrichtsform=inhalt;
            else if('raum' == was) u.raum=inhalt;
			else alert("Fehler: was "+bereich+" inhalt "+inhalt);
			}
		}
	req.open("GET",aufruf);
	req.send(null);	

	
	// gibt die Sekunden nach Mitternacht
	function _neue_zeit(zeit_text,alte_zeit){
        alte_zeit=parseInt(alte_zeit); // ** damit + auch addiert 
        const l_neu=zeit_text.split(':');
        let fehler='';
        if (l_neu.length !=2) fehler="Bitte Urzeit eingeben z.B. 14:15 löschen mit leer";
        else if(isNaN(l_neu[0]) || isNaN(l_neu[1]) ) fehler="Bitte nur Zahlen!";
        else if(l_neu[0]>23) fehler="Stunde größer als 23";
        else if(l_neu[1]>59) fehler="Minute größer als 59";
        if(fehler){alert(fehler);return(alte_zeit);}
        
        const l_alt = new Date(alte_zeit*1000).toTimeString().substring(0,5).split(':');
        const neu_sekunden=l_neu[0]*3600 + l_neu[1] *60;
        const alt_sekunden=l_alt[0]*3600 + l_alt[1] *60;
        
        return(alte_zeit+neu_sekunden-alt_sekunden);
    }
    
}

/*

// anlässlich AP einen Unterricht loeschen und alle Einträge auf den weiteren Unterricht verschieben, 
function unterricht_schieben(bereich,id,tabelle){
    var str="stdplan_editieren_eintragen.php?typ=unterricht_schieben&id="+id+"&tabelle="+tabelle;
    schicke_lade_neu(str);
}

function unterricht_einfuegen(bereich,id,tabelle){
    var str="stdplan_editieren_eintragen.php?typ=unterricht_einfuegen&id="+id+"&tabelle="+tabelle;
    schicke_lade_neu(str);
}

*/

// erzeugt ein 1-Menü Auswahlfeld
function auswahl(id,typ,vorauswahl,neuerUnterricht={}) {
	return(_auswahl(id,typ,vorauswahl,0,neuerUnterricht));
}

function auswahl_alle(id,typ,json_vorauswahl,neuerUnterricht={}){
	let vorauswahl=JSON.parse(json_vorauswahl);
	let neue_auswahl=_auswahl(id,typ,vorauswahl,1,neuerUnterricht={});
	let b=document.getElementById("auswahl");
	let eltern_knoten=b.parentNode;
	eltern_knoten.replaceChild(neue_auswahl, b);
}

// zeige die unterliste mit den Lernfelder oder Klassen
function sub_anzeigen(bereich){
	let b=document.getElementById(bereich);
    if(! b) alert("Fehler: in sub_anzeigen 1761 "+bereich);
	if(b.style.display=='block') b.style.display='none';
	else b.style.display='block';
}

// Unterfunktion inklusive alle
function _auswahl(id,typ,vorauswahl,ob_alle,neuerUnterricht={}){
    let vorauswahl_id=vorauswahl.dozent_id;
    if('dozent_id'==typ) vorauswahl_id=vorauswahl.klasse;
    
    // Aufbau der Solliste
   // let soll_liste=[{'name': 'ohne Lehrer', 'id':0, 'soll': [] }];
    let soll_liste=[];
    
    if('dozent_id'==typ) {
        if (ob_alle) soll_liste=Alle_lf; 
        else Standard.klassen.forEach(e=>e.soll.forEach(e1=>{
            if(e1.id==Standard.inhalt) {e1.name=e.inhalt; soll_liste.push(e1);}
        }));
    }
    else if('klasse'==typ || 'tag'==typ || 'raum'===typ){
        if(ob_alle){
            // name id soll
            const soll_alle=Alle_lf.find(x => x.klasse===vorauswahl.klasse).soll;
            Dozent.forEach(x => soll_liste.push( {name: x.name, id: x.id, soll: soll_alle}));
        }
        else {
            const soll=Standard.klassen.find(e=>e.inhalt==vorauswahl.klasse);
            soll_liste=soll.soll;
        }
       
    } 
    
	// dargestellt als Liste hellgraues Feld mit kleinerer Schrift
	const auswahl=document.createElement('ul');
	auswahl.style.backgroundColor="#eeeeee";
	auswahl.id='auswahl';
	auswahl.style.fontSize='smaller';
	auswahl.style.margin=0;
	auswahl.style.padding=0;
	auswahl.style.listStyle='none inside';
    
    let dieser_unterricht=vorauswahl;

    /*
    const unterricht_vorlage={'klasse':lernfelder[0].klasse,'klasse_id':lernfelder[0].klasse_id,
					'lernfeld_id':0,'lernfeld':'','schwerpunkt_id':0,'schwerpunkt':0,'sollstunden':0,
					'dozent_id':0,'dozent':'','von':dieser_unterricht.von, 'bis':dieser_unterricht.bis,'unterrichtform': 'praesenz', 'hinweis': '_'};
    */
    
    
    // äußere Schleife
    for(let i=0;i< soll_liste.length;i++){ //** i wird für id benötigt
        let name='';
        if (ob_alle){
            if('dozent_id'===Standard.typ) name = soll_liste[i].klasse;
            else if('klasse'===Standard.typ) name=soll_liste[i].name;
            soll_liste[i].name=name; // ** damit Konflikt funktioniert
          // if (soll_liste[i].schwerpunkt) name+=` ${soll_liste[i].schwerpunkt}`;
          // ** funktioniert nicht für alle Typen
        }
        else name=soll_liste[i].name;
        
        const von_date= new Date(dieser_unterricht.von * 1000);
        const bis_date= new Date(dieser_unterricht.bis * 1000);
        const v=von_date.getDay();
        const tag_nr= v==0 ? 7 : v-1;
        const von_zeit=(von_date.getHours()*3600)+von_date.getMinutes()*60;
        const bis_zeit=(bis_date.getHours()*3600)+bis_date.getMinutes()*60;
       
        
        // belegt ermitteln 
        const belegt={'status':'ok','text':'', 'farbe':''};
        if('dozent_id'==typ){ 
            const konflikt = U_zeit.find(e => soll_liste[i].name == e.klasse
                && e.klasse != dieser_unterricht.klasse  
                && e.bis>=dieser_unterricht.von
                && e.von <=dieser_unterricht.bis );
            if(konflikt) {
                belegt.status='belegt'; 
                belegt.text= `${konflikt.dozent} ${konflikt.lernfeld}`;
                belegt.farbe='#ff0000';
            }
        }
        else {
            // normale Zeiten Unterricht hell blauer Hintergrund
            
            const normale_zeiten = Wo_ist.find(x =>x.dozent_id==soll_liste[i].id
                && dieser_unterricht.dozent_id
                && tag_nr==x.tag
            //    && 'schule'==x.typ
                && (
                    (x.von==0 && x.von==0)
                    ||
                    (x.bis>=bis_zeit && x.von <=von_zeit)
                )
            );
    
            if(normale_zeiten){
                belegt.status='unterricht'; 
                
                if('schule'==normale_zeiten.typ) {
                    belegt.text= '';
                    belegt.farbe='#ccccff';
                }
                else {
                    belegt.text=normale_zeiten.typ;
                    belegt.farbe='#ffcccc';
                }
            }
            // besondere Zeiten
            const konflikt = U_zeit.find(x => soll_liste[i].id == x.dozent_id
                && soll_liste[i].id != dieser_unterricht.dozent_id  
                && x.bis>=dieser_unterricht.von
                && x.von <=dieser_unterricht.bis );
    
            if(konflikt) {
                belegt.status='belegt'; 
                belegt.text= `${konflikt.klasse} ${konflikt.lernfeld}`;
                belegt.farbe='#ff0000';
            } else {
                const konflikt_wo_ist= Wo_ist_cache.find(x=>x.dozent_id==soll_liste[i].id  
                    && x.bis>=dieser_unterricht.von
                    && x.von <=dieser_unterricht.bis);
                // wo_ist besondere Termine
                if(konflikt_wo_ist && 'schule' != konflikt_wo_ist.typ) {
                    // alert("konflitk 1313 ");
                    belegt.status='belegt';
                    const von=new Date(konflikt_wo_ist.von*1000).toTimeString().substring(0,5);
                    const bis=new Date(konflikt_wo_ist.bis*1000).toTimeString().substring(0,5);
                    const von_bis=`${von} - ${bis} `
                    belegt.text= `${konflikt_wo_ist.typ} ${von_bis} ${konflikt_wo_ist.kurzinfo}`;
                    belegt.farbe='#ffaaaa';
                }
            }
        }
        
        // den Link ausgeben
        const liste_eins= liste_knoten(auswahl,name,`javascript:sub_anzeigen('sub_ul_${i}')`,'',belegt.text);
        if(belegt.farbe) liste_eins.style.backgroundColor=belegt.farbe;
        
		// die Lernfelder und Schwerpunkte als submenüs
        let lernfelder = soll_liste[i].soll;
        if(ob_alle) {
            if('dozent_id'==Standard.typ) lernfelder=soll_liste.find(x => x.klasse===name).soll;
            else if('klasse'===Standard.typ) {
            }
            // else if('klasse'==Standard.typ) lernfelder=soll_liste.filter(x => x.name===name);
        }

        const nix={'klasse':lernfelder[0].klasse,'klasse_id':lernfelder[0].klasse_id,
					'lernfeld_id':0,'lernfeld':'','schwerpunkt_id':0,'schwerpunkt':0,'sollstunden':0,
					'dozent_id':lernfelder[0].dozent_id,'dozent':lernfelder[0].dozent,'von':dieser_unterricht.von, 'bis':dieser_unterricht.bis,'unterrichtform': 'praesenz', 'hinweis': ''};
				
        const sub_li_nix=document.createElement('li');
        
        // * aus einem mir unbekannten Grunde sind die lernfelder manchmal keine Arrays sondern Ojekte
		if(lernfelder.constructor === Array);
		else lernfelder = Object.keys(lernfelder).map((key) => {return lernfelder[key]});

        const sub_ul=document.createElement('ul');
        sub_ul.setAttribute('id','sub_ul_'+i);
        sub_ul.setAttribute('vorauswahl',JSON.stringify(vorauswahl) );
        sub_ul.style.padding="0 0 0 20px";
        
			
		if(lernfelder.length){
			// Formatierung, Vorauswahl bold sonst zunächst unsichtbar
			// hier erfolgt für alle items die Übergabe der vorauswahl
		    
            if( ('klasse'==Standard.typ && vorauswahl_id !=soll_liste[i].id) 
                || ('dozent_id' ==Standard.typ && vorauswahl_id!=soll_liste[i].name) )
			sub_ul.style.display='none';
        
                
			// die einzelnen Lernfelder 
            for(const lf of lernfelder){
                if(ob_alle && 'klasse'==Standard.typ) {
                    lf.dozent_id=soll_liste[i].id;
                    lf.dozent=soll_liste[i].name;
                }
                
                const sub_name=('tag'==typ) ? 
                    `${lf.klasse} ${lf.lernfeld} ${lf.schwerpunkt}` 
                    : `${lf.lernfeld} ${lf.schwerpunkt}`;
                const sollstunden=lf.sollstunden ?? '';

                // Unterliste
				const sub_li=document.createElement('li');
                lf.von=dieser_unterricht.von;
                lf.bis=dieser_unterricht.bis;
                lf.hinweis=dieser_unterricht.hinweis;
                lf.unterrichtsform=dieser_unterricht.unterrichtsform;
                const json_ausgewaehlt=JSON.stringify(lf);
                const href=`javascript:aktiviere_lernfeld('u_${id}',${id},'${typ}','${json_ausgewaehlt}')`;
                // if(ob_alle) alert("1949 "+href);
                // das ausgewählte Lernfeld bold
				if(vorauswahl.klasse==lf.klasse 
					&& vorauswahl.lernfeld_id==lf.lernfeld_id 
					&& vorauswahl.schwerpunkt_id==lf.schwerpunkt_id){ 
                        text_knoten(sub_li,sub_name,'b');
                }
                else link_knoten(sub_li,sub_name,href);
                
                /*
                          
                // wenn es Themen gibt, kann man nur das Thema aktivieren
                let themen=lf.themen;
                if (typeof themen == 'undefined') themen=[];
                if (0== themen.length) {
                    const a=document.createElement('a');
                    // hier erfolgt die Verbindung zu ajax was sonst onchange macht
                    lf.von=dieser_unterricht.von;
                    lf.bis=dieser_unterricht.bis
                    const json_ausgewaehlt=JSON.stringify(lf);
                    const href=`javascript:aktiviere_lernfeld('u_${id}',${id},'${typ}','${json_ausgewaehlt}')`;
                    // a.appendChild(sub_text);
                    // sub_li.appendChild(a);
                    liste_knoten(sub_li,name,href);
                }
                else {
                    sub_li.appendChild(sub_text);
                }
                */
            
                let themen=lf.themen;
                if (! themen) themen=[];
                
                if(themen.length){
                    const themen_ul=document.createElement('ul');
                    for(const thema of themen){
                        const themen_li=document.createElement('li');
                        
                        if(vorauswahl.thema_id == thema.thema_id) {
                            const text_fett=document.createElement('b');
                            text_fett.appendChild(document.createTextNode(thema.thema));
                            themen_li.appendChild(text_fett);
                            }
                        else {
                            const a=document.createElement('a');
                            thema.von=dieser_unterricht.von;
                            thema.bis=dieser_unterricht.bis
                
                            var json_ausgewaehlt1=JSON.stringify(thema);
                            // var v="javascript:aktiviere_lernfeld('u_"+id+"',"+ id + ",'"+ typ +"','"+json_ausgewaehlt+"')";
                            a.href="javascript:aktiviere_lernfeld('u_"+id+"',"+ id + ",'"+ typ +"','"+json_ausgewaehlt1+"')";
                            a.appendChild(document.createTextNode(thema.thema));
                            themen_li.appendChild(a);
                            }
                        themen_ul.appendChild(themen_li);
                        }
                    sub_li.appendChild(themen_ul);
				    }
                
				sub_ul.appendChild(sub_li);
				}
			auswahl.appendChild(sub_ul);
			}

            if(0==vorauswahl.lernfeld_id) text_knoten(sub_ul,'ohne Lernfeld','b');
            else link_knoten(sub_ul,'ohne Lernfeld',`javascript:aktiviere_lernfeld('u_${id}',${id},'${typ}','${JSON.stringify(nix)}')`);
		}

	// am Ende für Klasse "ohne Lehrer" und "alle"
	if('klasse'==Standard.typ) {
        if(ob_alle){
            // link_knoten(auswahl,"ohne Lehrer mit LF","javascript:alert('2057 in ohne Lehrer funktioniert noch nicht')");
            const sub_ul=document.createElement('ul');
			sub_ul.setAttribute('id','sub_ul_alle');
            sub_ul.style.display='none';
            link_knoten(auswahl,"ohne Lehrer mit LF",`javascript:sub_anzeigen('${sub_ul.id}')`);

            // const lernfelder=Standard.klassen.find(e=>e.inhalt==vorauswahl.klasse).alle.find(x=>x.id=Dozent[0].id).soll;
            const lernfelder=Alle_lf.find(x=>x.klasse===vorauswahl.klasse).soll;
            // Dozent[0].id ** totoal blöde, dass bei alle für jeden dozenten und Klasse das gleiche wiederholt wird. dirty 
            
            for(const lf of lernfelder){
                const sub_name=lf.schwerpunkt ? `${lf.lernfeld}  ${lf.schwerpunkt}` 
                    : lf.thema ? `${lf.lernfeld}  ${lf.thema}`
                    : lf.lernfeld;
                
                // Unterliste
				const sub_li=document.createElement('li');
                const lf1={...lf};
                lf1.von=dieser_unterricht.von;
                lf1.bis=dieser_unterricht.bis;
                // lf1.hinweis=dieser_unterricht.hinweis+ ' ohne Lehrer';
                lf1.unterrichtsform=dieser_unterricht.unterrichtsform;
                
                lf1.dozent='';
                lf1.dozent_id=0;
                // if (! lf1.hinweis) lf.hinweis="ohne Lehrer";
                const json_ausgewaehlt=JSON.stringify(lf1);
                const href=`javascript:aktiviere_lernfeld('u_${id}',${id},'${typ}','${json_ausgewaehlt}')`;
                // das ausgewählte Lernfeld bold
				if(vorauswahl.klasse==lf.klasse 
					&& vorauswahl.lernfeld_id==lf.lernfeld_id 
					&& vorauswahl.schwerpunkt_id==lf.schwerpunkt_id){ 
                        text_knoten(sub_li,sub_name,'b');
                }
                else link_knoten(sub_li,sub_name,href);
               sub_ul.appendChild(sub_li);
            }
            auswahl.appendChild(sub_ul);
            // link_knoten(auswahl,"ohne Lehrer mit LF","javascript:alert('2057 in ohne Lehrer funktioniert noch nicht')");
        }
        else {
            const ohne_alles ={'klasse':Standard.inhalt,'klasse_id':0,
                'lernfeld_id':0,'lernfeld':'','schwerpunkt_id':0,'schwerpunkt':0,'sollstunden':0,
                'dozent_id':0,'dozent':'','von':dieser_unterricht.von, 'bis':dieser_unterricht.bis,'unterrichtsform': 'sol', 'hinweis': 'selbst organisiert'};
        link_knoten(auswahl,"ohne Lehrer ohne LF",`javascript:aktiviere_lernfeld('u_${id}',${id},'${typ}','${JSON.stringify(ohne_alles)}')`);
        auswahl.appendChild(document.createElement('br'));
        }
    }
	
	if(! ob_alle) {
 

		const json_vorauswahl=JSON.stringify(vorauswahl); // ** falsch
		link_knoten(auswahl,"alle",`javascript:auswahl_alle(${id},'${typ}','${json_vorauswahl}')`);
		}


    return(auswahl);
	}
/*+++++++++++++++
+ schicke = Ajax-Kommunikation
++++++++++++++++*/

/*
// Objekt für die Übergaben
function Vorauswahl() {
	this.klasse_id=0;
	this.klasse='';
	this.dozent_id=0;
	this.dozent=''; 
	this.lernfeld_id=0;
	this.lernfeld='';
    this.thema_id=0;
    this.thema='';
	this.schwerpunkt_id=0;
	this.schwerpunkt='';
	};
*/

// onchange für die Lernfelder 
function aktiviere_lernfeld(bereich,id,typ,json_auswahl){
    
	const b=document.getElementById(bereich);
    if(! b) alert("Fehler in aktiviere_lernfeld "+bereich);
    
	const auswahl=JSON.parse(json_auswahl);
	// let suche=document.location.search.substr(1); // ** wird nicht mehr benötigt
	// suche=suche.replace(/&/g,'?');
	const b1=document.getElementById('unterrichtsform');
	const unterrichtsform=b1.value;
    
    let aufruf='';
    if(0==id) {
        const unterrichtsform1 = auswahl.unterrichtsform && auswahl.unterrichtsform.length>0 ? auswahl.unterrichtsform : unterrichtsform; 
        aufruf="stdplan_editieren_eintragen.php?typ=neuer_unterricht&id=0&inhalt="+typ
            +"&lernfeld_id="+auswahl.lernfeld_id
            +"&schwerpunkt_id="+auswahl.schwerpunkt_id+"&dozent_id="+auswahl.dozent_id
            +"&klasse_id="+auswahl.klasse_id
            +"&klasse="+auswahl.klasse
            +"&planung="+Standard.planung+"&unterrichtsform="+unterrichtsform1+"&von="+auswahl.von+"&bis="+auswahl.bis;
        if(auswahl.hinweis.length>0) aufruf+=`&hinweis=${auswahl.hinweis}`;
    }
    // ** für ohne Lernfeld ohne Lehrer weil Standard.inhalt den Klassennamen und nicht die id beinhaltet 
    // **wg garbage collector im alten Stundenplanprogramm mit autom. Hinweis
    else if(! auswahl.klasse_id ){
        aufruf="stdplan_editieren_eintragen.php?typ=aendern_auswahl&id="+id+"&inhalt="+typ
            +"&lernfeld_id="+auswahl.lernfeld_id
            +"&schwerpunkt_id="+auswahl.schwerpunkt_id+"&dozent_id="+auswahl.dozent_id
            +"&klasse_id=0&hinweis="+auswahl.hinweis
            +"&klasse="+auswahl.klasse
            +"&planung="+Standard.planung+"&unterrichtsform="+unterrichtsform;
        if(auswahl.hinweis.length>0) aufruf+=`&hinweis=${auswahl.hinweis}`;
    }
    else {
        aufruf="stdplan_editieren_eintragen.php?typ=aendern_auswahl&id="+id+"&inhalt="+typ
		+"&lernfeld_id="+auswahl.lernfeld_id
		+"&schwerpunkt_id="+auswahl.schwerpunkt_id
		+"&dozent_id="+auswahl.dozent_id
		+"&klasse_id="+auswahl.klasse_id
		+"&planung="+Standard.planung+"&unterrichtsform="+unterrichtsform;
    }
    if(undefined!=auswahl.thema_id) aufruf+="&thema_id="+auswahl.thema_id+"&thema="+auswahl.thema;
        
	const req = getXMLHttpRequest();
	if(! req) {alert("kann kein HttpRequest aufbauen"); return;}
	req.onreadystatechange = function(){
		if(req.readyState == 4) {
			const ergebnis= req.responseText;
			if('{' != ergebnis.substr(0,1) ) {alert('Fehler (aktiviere_lernfeld): '+ergebnis); return;}
			var e= JSON.parse(ergebnis);
			if('diagnostik'==e.ergebnis) alert("Diagnostik (aktiviere_lernfeld): "+ergebnis); 
			else if('nachfrage'==e.ergebnis) {
				nachfragen(b,e,aufruf);
				return;
				}

			else if('ok'!=e.ergebnis) {
				alert("nicht erfolgreich: "+e.ergebnis+"\n"+ergebnis); 
				return;
				}
            
            // neuer Unterricht, id korrekt eintragen
            if(0==id) {
                const neue_id=e.id;
                // "lernfeld_id":"7","lernfeld":"LF2","schwerpunkt_id":"0","schwerpunkt":"","themen":[],"dozent_id":1,"dozent":"Heeg, Paul","klasse":"Er_17","klasse_id":"24","sollstunden":"2","von":1612337400,"bis":1612342800
                // const feld_bereich=document.getElementById(bereich).parentNode.parentNode.id;
                
                const neu_bereich=b.parentNode.id;
                const u_feld=document.createElement('p');
                u_feld.id=`u_${neue_id}`;
                // const b1=b.parentNode.parentNode;
                const b1=b.parentNode;
                
                // b1.removeChild(b.parentNode);
                b1.removeChild(b);
                b1.appendChild(u_feld);

                auswahl.id=neue_id;

            
                ausgabe_html(u_feld.id,neue_id,auswahl);
         
                // den neuen Eintrag in die Unterrichtliste eintragen
                auswahl.id=neue_id;
                U_zeit.push(auswahl);
                info_bereich();
                
                // neu wiederherstellen
                ausgabe_neu(b1.id);
                // neu_wiederherstellen(b1.id,neu_bereich);
                U_alt.bereich=''; U_alt.id=0; U_alt.neu_id=0; 
                
                //** ohne zurück und wiederherstellen
                return;
            }
            else{
                const u_id=U_zeit.findIndex(e=>e.id==id);
                U_zeit[u_id].dozent_id=auswahl.dozent_id;
                U_zeit[u_id].dozent=auswahl.dozent;
                U_zeit[u_id].lernfeld=auswahl.lernfeld;
                U_zeit[u_id].lernfeld_id=auswahl.lernfeld_id;
                U_zeit[u_id].thema=auswahl.thema;
                U_zeit[u_id].thema_id=auswahl.thema_id;
                if(auswahl.hinweis) U_zeit[u_id].hinweis=auswahl.hinweis;
                
                // alert(auswahl.dozent_id);
                ausgabe_html(bereich,id,U_zeit.find(e=>e.id==id));
            }
            info_bereich();
			}
		}
	req.open("GET",aufruf);
	req.send(null);	

	}

// ohne ajax suchen, ob der Dozent oder die Klasse Zeit hat
// U_zeit{"id":"72570","klasse":"Er_15","inhalt":"LF1","dozent_id":"6","dozent":"Bednorz, Marion","von":"1613640600","bis":"1613646000"}
// Wo_ist[DOZENT_ID][TAG] =  {"dozent_id":"2","typ":"schule","kurzinfo":"","von":"116100","bis":"143100","inhalt":"","jahreswoche":"0","tag":"0"}]
// keine_zeit(typ [klasse|tag|dozent], id , name [die Klasse,der Tag, dozent_id] returns {'status':[ok|belegt|info], text:  str, farbe: rgb str}
//** könnte in closure von _auswahl oder sogar in die Funktion weil es 
  
	
	
// schreibe den aktuellen Stand auf den Bereich 'infobereich'
function info_bereich(){
    const b=document.getElementById('infobereich');
    b.innerHTML='';
    b.style.fontSize='small';    

    
    // was für klassen und dozent_id unterschiedlich ist
    let soll_klassen=[];
    if ('klasse'==Standard.typ) {
        const l=Standard.klassen.find(e=>e.inhalt==Standard.inhalt);
        if(l) soll_klassen=l.soll;
    }
    else soll_klassen=Standard.klassen;

    const _ist_liste= (dozent_id,klasse) => U_zeit.filter(e=> e.dozent_id==dozent_id && e.klasse==klasse);

    // welche Lernfelder unterrichtet werden müssen für klasse oder dozent_id
    function _soll_soll(soll) {
        // if('klasse'==Standard.typ) return(soll.soll);
        
        if('dozent_id'==Standard.typ){
            const sl=soll.soll.find(e=>e.id==Standard.inhalt);
            if(undefined===sl) return([]);
            else return(sl.soll);
        }
        else return(soll.soll);
    }
    
    // schreibe Fett Summe anzahl
    function fett_schreiben(text,inhalt) {       
        const fett = document.createElement('b');
        fett.appendChild(document.createTextNode(text));
        b.appendChild(fett);
        let filter;
        if('klasse'==Standard.typ) filter= e=>e.dozent_id==inhalt;
        else filter= e=>e.klasse==inhalt;
        
        const doz_summe=Math.round(U_zeit.filter(filter).reduce((sum,e)=>sum+parseInt(e.bis)-parseInt(e.von),0) / 2700);
        b.appendChild(document.createTextNode(` (${doz_summe})`));
        b.appendChild(document.createElement('br'));
    }
    
    // schreibe das lernfeld mit ist und soll Rückgabe ist_liste ohne dieses Lernfeld
    function lf_schreiben(soll,ist_liste){
        let ist_std=0;
        const ist_liste_lf=ist_liste.filter(e=>e.lernfeld==soll.lernfeld);
                // alert(JSON.stringify(ist_liste[0]));
        if(ist_liste.length>0) ist_std=Math.round(ist_liste_lf.reduce((sum,e)=>sum+parseInt(e.bis)-parseInt(e.von),0) / 2700);
                
        const lf_text=document.createElement('span');
        lf_text.appendChild( document.createTextNode(`\xa0\xa0${soll.lernfeld} ${ist_std} (${soll.sollstunden})`));
        if(0==ist_std) lf_text.style.color='#ff0000'; // rot wenn noch kein Unterricht in dem lf eingetragen
        else if(ist_std==soll.sollstunden) lf_text.style.color='green'; // grün wenn richtig
        b.appendChild(lf_text);
        b.appendChild(document.createElement('br'));
        // dieses Lernfeld löschen um am Ende die Lernfelder zu haben, für die es kein soll gibt.
        return(ist_liste.filter(e=>e.lernfeld!=soll.lernfeld));
    }

    // schreibe den Rest = Lernfelder für die es kein soll gab 
    function rest_schreiben(ist_liste){
        while (ist_liste.length>0){
            let ist_std=0;
            const ist_liste1=ist_liste.filter(e=>e.lernfeld==ist_liste[0].lernfeld);
            ist_std=Math.round(ist_liste1.reduce((sum,e)=>sum+parseInt(e.bis)-parseInt(e.von),0) / 2700);
            const lf_text=document.createElement('span');
            lf_text.appendChild( document.createTextNode(`\xa0\xa0${ist_liste[0].lernfeld} ${ist_std}`));
            b.appendChild(lf_text);
            b.appendChild(document.createElement('br'));
                // b.appendChild(document.createTextNode(JSON.stringify(ist_liste[0])));
            ist_liste=ist_liste.filter(e=>e.lernfeld!=ist_liste[0].lernfeld);
        }
    }
  
    // die Schleifen für die beiden Typen
    if('klasse'==Standard.typ){
        
        const klasse_summe=Math.round(U_zeit.filter(x=>x.klasse==Standard.inhalt).map(x=>x.bis-x.von).reduce((sum,x)=>sum+x, 0)/ (60*45) );
        b.appendChild(document.createTextNode(`Gesamt ${Standard.inhalt}: ${klasse_summe}`));
        b.appendChild(document.createElement('p'));
        
        // alert(JSON.stringify(U_zeit.filter(x=>x.klasse==Standard.inhalt)));
        
        for(const sub_soll of soll_klassen){
            let ist_liste=_ist_liste(sub_soll.id,Standard.inhalt);
            if(sub_soll.soll.length==0 && ist_liste.length==0) continue;
        
            fett_schreiben(sub_soll.name,sub_soll.id);
 
            // die Lernfelder
            for(const soll of _soll_soll(sub_soll) ) ist_liste=lf_schreiben(soll,ist_liste);
            rest_schreiben(ist_liste);
        }
    }
    
    else if('dozent_id'==Standard.typ){
        
        const dozent_summe=Math.round(U_zeit.filter(x=>x.dozent_id==Standard.inhalt).map(x=>x.bis-x.von).reduce((sum,x)=>sum+x,0 )/ (60*45));        
        b.appendChild(document.createTextNode(`Gesamt ${Dozent.find(x => x.id==Standard.inhalt).name}: ${dozent_summe}`));
        b.appendChild(document.createElement('p'));
               
        // alle Klassen wo der Dozent unterrichtet hat oder hätte sollen
        for(const sub_soll of soll_klassen){
            // alert(JSON.stringify(sub_soll.soll));
            // ist_liste = Dozent unterrichtet hat
            let ist_liste=_ist_liste(Standard.inhalt,sub_soll.inhalt);
            if(sub_soll.soll.length==0 && ist_liste.length==0) continue;

            fett_schreiben(sub_soll.inhalt,sub_soll.inhalt);
 
            // die Lernfelder
            for(const soll of _soll_soll(sub_soll) ){
                const ist_liste_lf=ist_liste.filter(e=>e.lernfeld==soll.lernfeld);
                ist_liste=lf_schreiben(soll,ist_liste);
            }
            rest_schreiben(ist_liste);
        }
    }
}


</script>
