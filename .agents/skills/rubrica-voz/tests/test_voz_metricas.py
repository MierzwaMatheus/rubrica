"""Testes do voz_metricas com um Markdown no formato da página /voz.

Rode da raiz do projeto: python3 -m unittest discover -s .agents/skills/rubrica-voz/tests
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import voz_metricas  # noqa: E402

MD = """<!-- rubrica-voz v1 -->
# Entrevista de voz

> Para o agente: ...

## Para começar

### A1. Como você explica o que faz?
<!-- uso: voz, apresentacao · tipo: aberta · modo: ditado -->

eu faço o computador fazer as tarefas chatas né que as pessoas fazem na mão tipo planilha

### B1. Projeto de orgulho
<!-- uso: voz, case · tipo: aberta · modo: sem resposta -->

_(sem resposta)_

## Escrevendo

### E1. Mensagem de atraso
<!-- uso: voz · tipo: escrita · modo: digitado -->

Oi, Ana. Vai atrasar. Dois dias, no máximo. Te mando a versão parcial amanhã cedo para você já ir vendo. Faltava muita gente na reunião.

### E3. Palavras que nunca usaria
<!-- uso: voz · tipo: aberta · modo: digitado -->

Jornada, sinergia, solução robusta.

### E5. Textos colados
<!-- uso: voz · tipo: colar · modo: colado -->

Reunião que podia ser e-mail. Sério.

### F2. Sério ou bem-humorado?
<!-- uso: voz · tipo: regua -->

4/5 (1 = sério, 5 = bem-humorado)
"""


class VozMetricasTeste(unittest.TestCase):
    def setUp(self):
        self.r = voz_metricas.analisar(MD)

    def test_separa_respondidas_vazias_e_reguas(self):
        self.assertEqual(self.r["resumo"]["respondidas"], ["A1", "E1", "E3", "E5"])
        self.assertEqual(self.r["resumo"]["sem_resposta"], ["B1"])
        self.assertEqual(self.r["resumo"]["reguas"], {"F2": "4"})

    def test_escrito_e_ditado_separados(self):
        self.assertEqual(self.r["escrito"]["respostas"], 3)
        self.assertEqual(self.r["ditado"]["respostas"], 1)
        self.assertTrue(self.r["escrito"]["frases_confiaveis"])
        self.assertFalse(self.r["ditado"]["frases_confiaveis"])
        self.assertIn("né", self.r["ditado"]["marcadores_orais"])
        self.assertNotIn("né", self.r["escrito"]["marcadores_orais"])

    def test_titulo_de_bloco_nao_entra_na_resposta(self):
        self.assertNotIn("escrevendo", self.r["total"]["palavras_de_conteudo_mais_usadas"])

    def test_a_gente_nao_conta_muita_gente(self):
        self.assertEqual(self.r["total"]["pessoa_por_1000_palavras"]["a_gente"], 0)

    def test_vetos_da_e3_nao_contam_como_uso_de_marcas_de_ia(self):
        self.assertEqual(self.r["escrito"]["linha_de_base_ia"].get("jornada", 0), 0)
        self.assertEqual(self.r["escrito"]["linha_de_base_ia"].get("sinergia", 0), 0)

    def test_avisa_corpus_pequeno(self):
        self.assertTrue(any("abaixo de ~2.000" in a for a in self.r["avisos"]))


if __name__ == "__main__":
    unittest.main()
