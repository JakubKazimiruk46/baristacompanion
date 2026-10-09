import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';

/** Miejsce do uzupełnienia przez autora (np. administrator danych, kontakt). */
function Fill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-amber-500/20 px-1 text-ink">[do uzupełnienia: {children}]</mark>;
}

/** Ostatnia zmiana treści polityki. */
export const PRIVACY_UPDATED = '9 października 2026';

/**
 * Polityka prywatności (/prywatnosc). Szkic: autor uzupełnia administratora danych i kontakt
 * (pytanie P6 w planie). Każda nowa funkcja z serwerem dopisuje tu, co zbiera i po co.
 */
export function PrivacyPage() {
  return (
    <article>
      <PageHeader
        title="Polityka prywatności"
        lead={`Krótko: bez konta nic nie wysyłamy. Ostatnia zmiana: ${PRIVACY_UPDATED}.`}
        back={{ to: '/konto', label: 'Konto' }}
      />

      <Section title="Kto odpowiada za dane">
        <p>
          Administratorem danych jest <Fill>imię i nazwisko albo nazwa firmy, adres</Fill>. Kontakt w sprawie danych:{' '}
          <Fill>adres e-mail</Fill>.
        </p>
      </Section>

      <Section title="Bez konta">
        <p>
          Ziarna, dziennik parzeń, ulubione, półka, lista zakupów, młynki i własne przepisy zapisują się tylko w Twojej
          przeglądarce (localStorage) i nie trafiają do nas. Skan etykiety bez konta działa w telefonie: zdjęcie nie
          opuszcza urządzenia. Przy pierwszym skanie przeglądarka pobiera rozpoznawanie tekstu z cdn.jsdelivr.net (tylko
          pliki programu, bez Twoich danych). Przepis wysłany linkiem jest w samym linku, po znaku #, więc nie trafia na
          serwer.
        </p>
      </Section>

      <Section title="Z kontem: co zbieramy i po co">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Adres e-mail i identyfikator konta</strong>: żeby Cię zalogować (link albo kod z e-maila, logowanie
            przez Google). Podstawa: wykonanie umowy o świadczenie usługi (art. 6 ust. 1 lit. b RODO).
          </li>
          <li>
            <strong>Nick</strong> (opcjonalnie): widoczny przy przepisach, które sam opublikujesz.
          </li>
          <li>
            <strong>Daty założenia konta i zmian</strong> oraz <strong>logi techniczne</strong> serwera (adres IP, czas,
            błędy): bezpieczeństwo i usuwanie awarii (uzasadniony interes, art. 6 ust. 1 lit. f RODO).
          </li>
        </ul>
        <p className="mt-3">Nie sprzedajemy danych, nie wyświetlamy reklam i nie śledzimy Cię między stronami.</p>
      </Section>

      <Section title="Gdzie są dane">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Supabase</strong> (baza danych i logowanie), serwery w Unii Europejskiej (
            <Fill>region projektu, np. Frankfurt</Fill>).
          </li>
          <li>
            <strong>Vercel</strong> (hosting aplikacji): przekazuje stronę, nie przechowuje Twoich danych z aplikacji.
          </li>
          <li>
            <strong>Google</strong>: tylko jeśli logujesz się przez Google (Google przekazuje nam adres e-mail).
          </li>
        </ul>
        <p className="mt-3">
          Te firmy przetwarzają dane w naszym imieniu na podstawie umów powierzenia. Jeśli dane trafiają poza
          Europejski Obszar Gospodarczy, dzieje się to na podstawie standardowych klauzul umownych albo programu EU-US
          Data Privacy Framework.
        </p>
      </Section>

      <Section title="Jak długo">
        <p>
          Dane konta trzymamy, dopóki masz konto. Po usunięciu konta znikają od razu z bazy, a z kopii zapasowych
          dostawcy po <Fill>okres przechowywania kopii, np. 7 dni</Fill>. Logi techniczne dostawca usuwa po{' '}
          <Fill>okres, np. 7–90 dni zależnie od planu</Fill>.
        </p>
      </Section>

      <Section title="Twoje prawa">
        <ul className="list-disc space-y-1 pl-5">
          <li>dostęp do danych i ich kopia: „Pobierz dane konta” na ekranie konta,</li>
          <li>poprawienie danych (nick na ekranie konta),</li>
          <li>usunięcie danych: „Usuń konto” usuwa konto i wszystkie dane na serwerze,</li>
          <li>przeniesienie danych (plik JSON), sprzeciw i ograniczenie przetwarzania,</li>
          <li>skarga do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).</li>
        </ul>
      </Section>

      <Section title="Pliki cookie i pamięć przeglądarki">
        <p>
          Nie używamy cookies reklamowych ani analitycznych. Pamięć przeglądarki służy tylko do działania aplikacji
          (Twoje dane, ustawienia, sesja logowania), więc nie wymaga zgody.
        </p>
      </Section>

      <Section title="Zmiany">
        <p>
          O ważnych zmianach poinformujemy w aplikacji. Wersja z datą zmiany jest zawsze tutaj. Wróć do{' '}
          <Link to="/konto" className="font-medium text-accent underline">
            konta
          </Link>
          .
        </p>
      </Section>
    </article>
  );
}
