function parse_dom_table(table, _opts) {
        var opts = _opts || {};
        if (DENSE != null) opts.dense = DENSE;
        var ws = opts.dense ? ([]) : ({});
        var rows = table.getElementsByTagName('tr');
        var range = {s: {r: 0, c: 0}, e: {r: rows.length - 1, c: 0}};
        var merges = [], midx = 0;
        var R = 0, _C = 0, C = 0, RS = 0, CS = 0;

        var name = table.getAttribute('name') || ''

	var color, noborders, bold;
        ws['!cols'] = []

        for (; R < rows.length; ++R) {
            var row = rows[R];
            var elts = row.children;
            for (_C = C = 0; _C < elts.length; ++_C) {
                var elt = elts[_C], v = elts[_C].innerText || elts[_C].textContent;
                for (midx = 0; midx < merges.length; ++midx) {
                    var m = merges[midx];
                    if (m.s.c == C && m.s.r <= R && R <= m.e.r) {
                        C = m.e.c + 1;
                        midx = -1;
                    }
                }
                /* TODO: figure out how to extract nonstandard mso- style */
                CS = +elt.getAttribute("colspan") || 1;

		color = elt.getAttribute("argb") || '00000000';
		noborders =  elt.getAttribute("noborders") ? true : false;
		bold =  elt.getAttribute("bold") || false;

                if ((RS = +elt.getAttribute("rowspan")) > 0 || CS > 1) merges.push({
                    s: {r: R, c: C},
                    e: {r: R + (RS || 1) - 1, c: C + CS - 1}
                })

                var o = {t: 's', v: v};
                
                if(typeof ws['!cols'][C] == 'undefined')
                  ws['!cols'][C] = {wch:5};
                if(v.trim().length > ws['!cols'][C].wch) {
                  if(name == 'overall' && R > 1 || name != 'overall') {
                    ws['!cols'][C].wch = ((name == 'overall' && R == 1) || (name != 'overall' && R == 0) ? v.trim().length / 3 + 3 | 0 : v.trim().length + 2)
                  }
                }

                if (v != null && v.length) {
                    if (!isNaN(Number(v))) o = {t: 'n', v: Number(v)};
                    else if (!isNaN(fuzzydate(v).getDate())) {
                        o = ({t: 'd', v: parseDate(v)});
                        if (!opts.cellDates) o = ({t: 'n', v: datenum(o.v)});
                        o.z = opts.dateNF || SSF._table[14];
                    }
                }

		o.s = {font: {bold: bold, color: {rgb: color}}}
		if(!noborders) o.s.border = {
                        top: {style: "thin", color: {auto: 1}},
                        right: {style: "thin", color: {auto: 1}},
                        bottom: {style: "thin", color: {auto: 1}},
                        left: {style: "thin", color: {auto: 1}}
                }

                if (opts.dense) {
                    if (!ws[R]) ws[R] = [];
                    ws[R][C] = o;
                }
                else ws[encode_cell({c: C, r: R})] = o;
                if (range.e.c < C) range.e.c = C;
                C += CS;
            }
        }
        ws['!merges'] = merges;
        ws['!ref'] = encode_range(range);
        return ws;
    }
