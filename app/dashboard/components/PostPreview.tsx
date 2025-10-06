"use client";

import { Heart, MessageCircle } from "lucide-react";
import Image from "next/image";

const CATEGORY_PREVIEW = [
  { label: "Conseil", color: "#C9C9C9" },
  { label: "Artisanat", color: "#FF9AA2" },
  { label: "Voyage", color: "#4EA7FF" },
];

interface PostPreviewProps {
  colors: {
    Posts: string;
    Bordures: string;
    Fond: string;
    Police: string;
  };
  selectedFont: string;
  coverImage?: string;
}

export default function PostPreview({
  colors,
  selectedFont,
  coverImage,
}: PostPreviewProps) {
  return (
    <div className="lg:sticky lg:top-4">
      <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-4">
        Aperçu
      </h4>

      <div
        className="rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 hover:shadow-sm"
        style={{
          backgroundColor: colors.Fond,
          border: `1px solid ${colors.Bordures}`,
          fontFamily: selectedFont,
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${colors.Posts}20` }}
          >
            <span
              className="text-[10px] sm:text-xs font-semibold"
              style={{ color: colors.Posts }}
            >
              TA
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
              Tester A.
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">
              Il y a 2 heures
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap mb-2 sm:mb-3">
          {CATEGORY_PREVIEW.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-1.5 sm:gap-3 rounded-full border px-2 py-1 sm:px-4 sm:py-2 bg-white/60 backdrop-blur-sm"
              style={{ borderColor: colors.Bordures }}
            >
              <span
                className="inline-block rounded-full flex-shrink-0"
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: c.color,
                }}
              />
              <span className="text-gray-900 text-[10px] sm:text-sm font-medium whitespace-nowrap">
                {c.label}
              </span>
            </div>
          ))}
        </div>
        <p
          className="text-xs sm:text-[15px] mb-2 sm:mb-3 font-medium line-clamp-2 sm:line-clamp-none"
          style={{ color: colors.Police }}
        >
          Vous connaissez un bon site qui vends des marques vintage ?
        </p>
        <div
          className="rounded-lg sm:rounded-xl overflow-hidden border mb-3 sm:mb-4"
          style={{ borderColor: colors.Bordures }}
        >
          <Image
            src="/Post-picture.png"
            alt="Exemple de post"
            width={800}
            height={420}
            className="w-full h-32 sm:h-52 object-cover"
          />
        </div>
        <div className="text-[11px] sm:text-[13px] leading-5 sm:leading-6 mb-3 sm:mb-4 text-gray-700">
          <p className="line-clamp-6 sm:line-clamp-none">
            Hello à tous,
            <br /> En ce moment, je suis grave dans une phase "retro" et j'ai
            vraiment envie de refaire un peu ma garde-robe avec des vêtements
            vintage. J'ai déjà fait quelques friperies en ville mais j'aimerais
            tester des sites e-commerce pour avoir plus de choix et dénicher des
            marques stylées (genre Levi's vintage, Adidas old school, Nike
            années 90, ou même des petites marques moins connues mais avec du
            vrai style). Le problème, c'est que sur le net, il y a un peu de
            tout : des sites hyper chers, des arnaques, et parfois des
            sélections qui sentent la fast fashion… Du coup, je me tourne vers
            vous pour avoir vos recommandations de boutiques en ligne fiables,
            avec une vraie sélection de pièces vintage ! Ça peut être des
            plateformes spécialisées, des shops indépendants ou même des comptes
            Insta/Depop/Vinted si vous avez eu de vraies bonnes expériences. Je
            suis surtout preneur de sites où :
          </p>
          <ul className="my-2 sm:my-3 pl-3 sm:pl-4 hidden sm:block">
            <li>
              La qualité est au rendez-vous (pas des fringues qui tombent en
              morceaux après 2 lavages…)
            </li>
            <li>
              L'authenticité est garantie (vraies marques, pas de copies ni de
              faux vintage)
            </li>
            <li>
              Les descriptions/taille sont fiables (c'est chaud d'acheter en
              ligne sans pouvoir essayer)
            </li>
          </ul>
          <p className="hidden sm:block">
            Bref, n'hésitez pas à balancer vos meilleures adresses, vos avis, ou
            même vos achats coup de cœur récents (avec photos si vous voulez
            montrer vos trouvailles !). Si vous avez eu des mauvaises surprises
            aussi, je veux bien vos mises en garde pour éviter de tomber dans
            les mêmes pièges. Merci d'avance pour tous vos retours!
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 text-gray-500">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs">24</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs">10</span>
          </div>
        </div>
      </div>

      {coverImage && (
        <div className="bg-white rounded-lg sm:rounded-xl border border-chart-4 overflow-hidden">
          <Image
            src={coverImage}
            alt="Preview"
            width={1200}
            height={200}
            className="w-full h-24 sm:h-32 object-cover"
          />
          <div className="p-3 sm:p-4">
            <h5 className="font-medium text-xs sm:text-sm">
              Avec photo de couverture
            </h5>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              Aperçu de votre forum
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
